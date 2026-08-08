const BREVO_BASE = "https://api.brevo.com/v3";
const MARKETING_LIST_ID = 3;
const PIPELINE_NAME = "Clients & prospects";
const STAGE_ORDER = {
  "Nouvelle": 0,
  "En qualification": 1,
  "Démo programmée": 2,
  "En attente d'engagement": 3,
  "En négociation": 4,
  "Gagnée": 5,
  "Perdue": 5,
};
const TERMINAL_STAGES = new Set(["Gagnée", "Perdue"]);
const REQUIRED_DEAL_ATTRIBUTES = [
  "Référence source",
  "Type relation",
  "Source commerciale",
  "Résultat du call",
  "Dernière action",
  "Prochaine action",
  "Produit / offre",
  "Statut achat",
  "Qualité client",
  "État relation",
  "Résumé commercial",
];

let schemaCache = null;

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function compact(value, limit) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function validEmail(value) {
  return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(String(value).trim());
}

function isQaLead(email, firstName = "", text = "") {
  const combined = `${email} ${firstName} ${text}`.toLowerCase();
  return String(email).toLowerCase().includes("+qa-") || combined.includes("test qa") || String(firstName).toLowerCase() === "qa";
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(String(value).trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sourceRef(prefix, stableValue) {
  return `${prefix}:${(await sha256(stableValue)).slice(0, 20)}`;
}

async function brevo(env, path, { method = "GET", body } = {}) {
  if (!env.BREVO_API_KEY) throw new Error("Configuration Brevo absente");
  const response = await fetch(`${BREVO_BASE}${path}`, {
    method,
    headers: {
      "api-key": env.BREVO_API_KEY,
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text.slice(0, 300) }; }
  }
  if (!response.ok) throw new Error(`Brevo ${response.status}: ${compact(payload.message || "erreur", 200)}`);
  return payload;
}

async function getContact(env, email) {
  const response = await fetch(`${BREVO_BASE}/contacts/${encodeURIComponent(email)}`, {
    headers: { "api-key": env.BREVO_API_KEY, accept: "application/json" },
  });
  if (response.status === 404) return null;
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`Lecture contact Brevo ${response.status}`);
  return payload;
}

async function upsertContact(env, { email, attributes, marketingOptIn }) {
  email = String(email).trim().toLowerCase();
  if (!validEmail(email)) throw new Error("Adresse email invalide");
  const existing = await getContact(env, email);
  const cleanAttributes = Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
  );
  if (marketingOptIn === true) cleanAttributes.OPT_IN = true;
  else if (!existing) cleanAttributes.OPT_IN = false;
  else delete cleanAttributes.OPT_IN;

  const body = { email, attributes: cleanAttributes, updateEnabled: true };
  if (marketingOptIn === true) body.listIds = [MARKETING_LIST_ID];
  await brevo(env, "/contacts", { method: "POST", body });
  const refreshed = await getContact(env, email);
  if (!refreshed?.id) throw new Error("Contact Brevo introuvable après enregistrement");
  return { id: Number(refreshed.id), action: existing ? "contact_update" : "contact_create" };
}

async function loadSchema(env) {
  if (schemaCache && schemaCache.expiresAt > Date.now()) return schemaCache.value;
  const pipelines = await brevo(env, "/crm/pipeline/details/all");
  const pipeline = pipelines.find((item) => item.pipeline_name === PIPELINE_NAME);
  if (!pipeline) throw new Error(`Pipeline Brevo introuvable : ${PIPELINE_NAME}`);
  const rawAttributes = await brevo(env, "/crm/attributes/deals");
  const attributes = Object.fromEntries(rawAttributes.map((item) => [item.label, item]));
  const missing = REQUIRED_DEAL_ATTRIBUTES.filter((label) => !attributes[label]);
  if (missing.length) throw new Error(`Attributs Deals manquants : ${missing.join(", ")}`);
  const value = { pipeline, attributes };
  schemaCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

function internal(schema, label) {
  return String(schema.attributes[label].internalName);
}

function option(schema, label, value) {
  const found = (schema.attributes[label].attributeOptions || []).find((item) => item.value === value);
  if (!found) throw new Error(`Option Deals absente : ${label} = ${value}`);
  return String(found.key);
}

async function loadDeals(env) {
  const payload = await brevo(env, "/crm/deals?limit=100");
  return payload.items || [];
}

function findDeal(schema, deals, reference, contactId) {
  const pipelineId = schema.pipeline.pipeline;
  const refKey = internal(schema, "Référence source");
  const stagesById = Object.fromEntries(schema.pipeline.stages.map((stage) => [stage.id, stage.name]));
  const inPipeline = deals.filter((deal) => (deal.attributes || {}).pipeline === pipelineId);
  const exact = inPipeline.find((deal) => String((deal.attributes || {})[refKey] || "") === reference);
  if (exact) return exact;
  const active = inPipeline.filter((deal) => {
    if (!(deal.linkedContactsIds || []).includes(contactId)) return false;
    return !TERMINAL_STAGES.has(stagesById[(deal.attributes || {}).deal_stage] || "");
  });
  return active.length === 1 ? active[0] : null;
}

async function upsertDeal(env, input) {
  const schema = await loadSchema(env);
  const stages = Object.fromEntries(schema.pipeline.stages.map((stage) => [stage.name, stage.id]));
  const stageById = Object.fromEntries(schema.pipeline.stages.map((stage) => [stage.id, stage.name]));
  if (!stages[input.desiredStage]) throw new Error(`Étape Deals absente : ${input.desiredStage}`);
  const deals = await loadDeals(env);
  const existing = findDeal(schema, deals, input.reference, input.contactId);
  const current = existing?.attributes || {};
  const currentStageName = stageById[current.deal_stage] || "";
  const currentCallKey = String(current[internal(schema, "Résultat du call")] || "");
  const heldKey = option(schema, "Résultat du call", "Tenu");
  const cancellationOfBookedCall = input.desiredStage === "Nouvelle" && input.callResult === "Annulé" && currentStageName === "Démo programmée" && currentCallKey !== heldKey;
  let finalStage = input.desiredStage;
  if (currentStageName) {
    if (TERMINAL_STAGES.has(currentStageName)) finalStage = currentStageName;
    else if ((STAGE_ORDER[currentStageName] ?? -1) > STAGE_ORDER[input.desiredStage] && !cancellationOfBookedCall) finalStage = currentStageName;
  }
  const advancedExisting = Boolean(currentStageName && (STAGE_ORDER[currentStageName] ?? -1) > STAGE_ORDER[input.desiredStage] && !cancellationOfBookedCall);

  const nonReservedKey = option(schema, "Résultat du call", "Non réservé");
  const incomingCallKey = option(schema, "Résultat du call", input.callResult);
  let finalCallKey = incomingCallKey;
  if (currentCallKey === heldKey) finalCallKey = heldKey;
  else if (incomingCallKey === nonReservedKey && currentCallKey) finalCallKey = currentCallKey;

  const sourceKey = internal(schema, "Source commerciale");
  const existingSource = compact(current[sourceKey], 1000);
  const finalSource = existingSource && existingSource !== "À qualifier" ? existingSource : compact(input.source, 1000);
  const summaryKey = internal(schema, "Résumé commercial");
  const existingSummary = compact(current[summaryKey], 4000);
  const incomingSummary = compact(input.summary, 4000);
  const finalSummary = existingSummary && incomingSummary && !existingSummary.includes(incomingSummary)
    ? compact(`${existingSummary} | ${incomingSummary}`, 4000)
    : existingSummary || incomingSummary;

  const refKey = internal(schema, "Référence source");
  const attributes = {
    pipeline: schema.pipeline.pipeline,
    deal_stage: stages[finalStage],
    deal_description: finalSummary,
    [refKey]: compact(current[refKey] || input.reference, 1000),
    [internal(schema, "Type relation")]: current[internal(schema, "Type relation")] || option(schema, "Type relation", "Prospect coaching"),
    [sourceKey]: finalSource || "À qualifier",
    [internal(schema, "Résultat du call")]: finalCallKey,
    [internal(schema, "Dernière action")]: compact(advancedExisting ? current[internal(schema, "Dernière action")] : input.lastAction, 1000),
    [internal(schema, "Prochaine action")]: compact(advancedExisting ? current[internal(schema, "Prochaine action")] : input.nextAction, 1000),
    [internal(schema, "Produit / offre")]: current[internal(schema, "Produit / offre")] || "Coaching confiance",
    [internal(schema, "Statut achat")]: current[internal(schema, "Statut achat")] || option(schema, "Statut achat", "Jamais acheté"),
    [internal(schema, "Qualité client")]: current[internal(schema, "Qualité client")] || option(schema, "Qualité client", "À qualifier"),
    [internal(schema, "État relation")]: current[internal(schema, "État relation")] || option(schema, "État relation", "Prospect actif"),
    [summaryKey]: finalSummary,
  };
  const linkedContactsIds = Array.from(new Set([...(existing?.linkedContactsIds || []), input.contactId])).sort((a, b) => a - b);
  const body = { name: compact(`Coaching — ${input.displayName}`, 200), attributes, linkedContactsIds };
  if (existing) {
    await brevo(env, `/crm/deals/${existing.id}`, { method: "PATCH", body });
    return { action: "deal_update", id: String(existing.id) };
  }
  const created = await brevo(env, "/crm/deals", { method: "POST", body });
  return { action: "deal_create", id: created.id ? String(created.id) : null };
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

function quizPayload(body) {
  return {
    email: compact(body.email, 254).toLowerCase(),
    prenom: compact(body.prenom, 100),
    nom: compact(body.nom, 100),
    profil: compact(body.profil, 200),
    niveau1: Number(body.niveau_1),
    niveau2: Number(body.niveau_2),
    niveau3: Number(body.niveau_3),
    marketing: body.consentement_emails === "oui" || body.consentement_emails === true,
    utmSource: compact(body.utm_source || "site-direct", 200),
    utmMedium: compact(body.utm_medium, 200),
    utmCampaign: compact(body.utm_campaign, 200),
    utmContent: compact(body.utm_content, 200),
    utmTerm: compact(body.utm_term, 200),
    website: compact(body.website, 200),
  };
}

async function handleQuiz(request, env) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 16384) return json({ ok: false }, 413);
  const body = await request.json();
  const lead = quizPayload(body);
  if (lead.website) return json({ ok: true });
  if (!validEmail(lead.email) || !lead.prenom || !lead.nom || !lead.profil) return json({ ok: false, message: "Informations incomplètes" }, 400);
  if (![lead.niveau1, lead.niveau2, lead.niveau3].every((score) => Number.isFinite(score) && score >= 0 && score <= 100)) return json({ ok: false, message: "Résultat invalide" }, 400);
  if (isQaLead(lead.email, lead.prenom, lead.profil)) return json({ ok: true, test: true });

  const score = Math.round(((lead.niveau1 + lead.niveau2 + lead.niveau3) / 3) * 10) / 10;
  const summary = `Quiz 3 niveaux : ${lead.profil} | provoquer ${lead.niveau1} | séduire ${lead.niveau2} | fréquenter ${lead.niveau3} | campagne ${lead.utmCampaign || "-"} / ${lead.utmContent || "-"}`;
  const contact = await upsertContact(env, {
    email: lead.email,
    attributes: { PRENOM: lead.prenom, NOM: lead.nom, PROFIL: lead.profil, SOURCE: lead.utmSource, SCORE_TOTAL: score, SITUATION: summary.slice(0, 500) },
    marketingOptIn: lead.marketing,
  });
  await upsertDeal(env, {
    reference: await sourceRef("quiz", lead.email),
    contactId: contact.id,
    displayName: `${lead.prenom} ${lead.nom}`.trim(),
    desiredStage: "En qualification",
    source: lead.utmSource,
    callResult: "Non réservé",
    lastAction: `Quiz complété — profil ${lead.profil}`,
    nextAction: "Contacter rapidement et vérifier si un call est pertinent",
    summary,
  });
  return json({ ok: true });
}

function responseValue(responses, keys) {
  for (const key of keys) {
    const raw = responses?.[key];
    const value = raw && typeof raw === "object" && "value" in raw ? raw.value : raw;
    if (value !== undefined && value !== null && String(value).trim()) return compact(value, 500);
  }
  return "";
}

function calPayload(event) {
  const payload = event?.payload || {};
  const attendee = payload.attendees?.[0] || {};
  const responses = payload.responses || payload.bookingFieldsResponses || {};
  const name = responseValue(responses, ["name"]) || compact(attendee.name, 200);
  const email = (responseValue(responses, ["email"]) || compact(attendee.email, 254)).toLowerCase();
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    trigger: compact(event?.triggerEvent, 100).toUpperCase(),
    uid: compact(payload.uid || payload.bookingUid || payload.bookingId, 200),
    email,
    name: name || email.split("@")[0],
    prenom: compact(attendee.firstName || parts[0], 100),
    nom: compact(attendee.lastName || parts.slice(1).join(" "), 100),
    situation: responseValue(responses, ["situation", "Situation"]),
    dejaEssaye: responseValue(responses, ["deja-essaye", "deja_essaye", "Déjà essayé", "dejaEssayé"]),
    source: responseValue(responses, ["source", "Source"]) || "Inbound — réservation Cal",
    start: compact(payload.startTime || payload.start, 100),
    rescheduleUid: compact(payload.rescheduleUid, 200),
  };
}

async function verifyCalSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  const normalized = signature.trim().replace(/^sha256=/i, "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(normalized)) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) diff |= expected.charCodeAt(index) ^ normalized.charCodeAt(index);
  return diff === 0;
}

function humanDate(value) {
  if (!value) return "date à confirmer";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return compact(value, 100);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }).format(parsed);
}

async function handleCal(request, env) {
  const rawBody = await request.text();
  const valid = await verifyCalSignature(rawBody, request.headers.get("x-cal-signature-256"), env.CAL_WEBHOOK_SECRET);
  if (!valid) return json({ ok: false }, 401);
  const event = JSON.parse(rawBody);
  const booking = calPayload(event);
  const accepted = new Set(["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"]);
  if (!accepted.has(booking.trigger)) return json({ ok: true, ignored: true });
  if (!validEmail(booking.email) || !booking.uid) return json({ ok: false }, 400);
  if (isQaLead(booking.email, booking.prenom, `${booking.situation} ${booking.dejaEssaye}`)) return json({ ok: true, test: true });
  if (booking.trigger === "BOOKING_CANCELLED" && booking.rescheduleUid) return json({ ok: true, rescheduled: true });

  const cancelled = booking.trigger === "BOOKING_CANCELLED";
  const callDate = humanDate(booking.start);
  const summary = [booking.situation, booking.dejaEssaye].filter(Boolean).join(" | ") || `Réservation Cal pour le ${callDate}.`;
  const contact = await upsertContact(env, {
    email: booking.email,
    attributes: { PRENOM: booking.prenom, NOM: booking.nom, SOURCE: booking.source, SITUATION: booking.situation, DEJA_ESSAYE: booking.dejaEssaye, CALL_BOOKED_AT: booking.start },
    marketingOptIn: null,
  });
  await upsertDeal(env, {
    reference: await sourceRef("cal", booking.uid),
    contactId: contact.id,
    displayName: booking.name,
    desiredStage: cancelled ? "Nouvelle" : "Démo programmée",
    source: booking.source,
    callResult: cancelled ? "Annulé" : "Réservé",
    lastAction: cancelled ? `Réservation Cal annulée — ${callDate}` : `Call réservé sur Cal — ${callDate}`,
    nextAction: cancelled ? "Relancer seulement si c'est pertinent pour sa situation" : `Préparer puis tenir le call du ${callDate}`,
    summary,
  });
  return json({ ok: true });
}

export { calPayload, quizPayload, verifyCalSignature };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") return json({ ok: true, service: "allan-coaching" });
      if (url.pathname === "/api/quiz" && request.method === "POST") return await handleQuiz(request, env);
      if (url.pathname === "/api/cal" && request.method === "POST") return await handleCal(request, env);
      if (url.pathname.startsWith("/api/")) return json({ ok: false }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      const requestId = crypto.randomUUID();
      console.error("allan-coaching", requestId, error?.name || "Error");
      return json({ ok: false, message: "Le service n'a pas pu enregistrer la demande.", requestId }, 500);
    }
  },
};
