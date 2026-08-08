import assert from "node:assert/strict";
import test from "node:test";
import { calPayload, quizPayload, verifyCalSignature } from "./index.js";

test("le quiz conserve les UTM et le consentement", () => {
  const lead = quizPayload({
    email: "Jean@example.com",
    prenom: "Jean",
    nom: "Dupont",
    profil: "Niveau 1",
    niveau_1: 20,
    niveau_2: 50,
    niveau_3: 80,
    consentement_emails: "oui",
    utm_source: "youtube",
    utm_campaign: "immersion",
  });
  assert.equal(lead.email, "jean@example.com");
  assert.equal(lead.marketing, true);
  assert.equal(lead.utmSource, "youtube");
  assert.equal(lead.utmCampaign, "immersion");
});

test("une réservation Cal lit les réponses et l'identité", () => {
  const booking = calPayload({
    triggerEvent: "BOOKING_CREATED",
    payload: {
      uid: "abc-123",
      startTime: "2026-08-10T10:00:00Z",
      attendees: [{ name: "Jean Dupont", email: "jean@example.com", firstName: "Jean", lastName: "Dupont" }],
      responses: {
        situation: { value: "Je bloque sur le terrain" },
        "deja-essaye": { value: "Des vidéos" },
        source: { value: "YouTube" },
      },
    },
  });
  assert.equal(booking.uid, "abc-123");
  assert.equal(booking.prenom, "Jean");
  assert.equal(booking.situation, "Je bloque sur le terrain");
  assert.equal(booking.source, "YouTube");
});

test("la signature Cal est vérifiée", async () => {
  const secret = "secret-test";
  const body = JSON.stringify({ triggerEvent: "BOOKING_CREATED", payload: { uid: "abc" } });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  assert.equal(await verifyCalSignature(body, signature, secret), true);
  assert.equal(await verifyCalSignature(body, "0".repeat(64), secret), false);
});
