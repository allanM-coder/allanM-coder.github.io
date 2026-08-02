/* ============ CONFIG CAPTURE ============ */
const LEAD_ENDPOINT = "https://formsubmit.co/ajax/allanmaisak@gmail.com";
const BOOK_URL = "https://cal.com/allan-figfsv/appel-confiance-offert";
function trackEvent(name,properties){
  if(typeof window.amTrack === 'function'){ window.amTrack(name,properties || {}); }
}
const TRACKING_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const TRACKING = Object.fromEntries(TRACKING_KEYS.map(k=>[k,new URLSearchParams(location.search).get(k)||'']));
function trackedBookUrl(content){
  const url = new URL(BOOK_URL);
  TRACKING_KEYS.forEach(k=>{ if(TRACKING[k]) url.searchParams.set(k,TRACKING[k]); });
  if(content) url.searchParams.set('utm_content',content);
  return url.toString();
}
const topCall = document.querySelector('.top-call');
if(topCall) topCall.href = trackedBookUrl('quiz-header');

/* ============ QUESTIONS ============
   Axes : N1 = provoquer la rencontre · N2 = seduire · N3 = frequenter.
   Un niveau se debloque dans l'ordre : on renvoie le PREMIER des trois sous le seuil. */
const Q = [
  /* ---- NIVEAU 1 : PROVOQUER LA RENCONTRE ---- */
  { q:"Tu croises une femme qui te plaît. Il se passe quoi dans les dix secondes qui suivent ?",
    o:[["Je vais lui parler.",{N1:3}],
       ["Je cherche une bonne raison d'y aller. Elle est déjà loin.",{N1:1}],
       ["Rien. Et j'y repense le soir.",{N1:0}],
       ["Je me dis que c'est pas le bon moment. Comme d'habitude.",{N1:0}]]},
  { q:"La dernière fois que t'as parlé à une inconnue qui te plaisait, c'était quand ?",
    o:[["Cette semaine.",{N1:3}],
       ["Ce mois-ci.",{N1:2}],
       ["Il y a des mois.",{N1:1}],
       ["Je m'en souviens même pas.",{N1:0}],
       ["Jamais. J'ai jamais fait ça.",{N1:0}]]},
  { q:"Aujourd'hui, tu rencontres des femmes comment ?",
    o:[["Je provoque : je sors, je parle aux gens, ça arrive.",{N1:3}],
       ["Applications. Et ça mène nulle part.",{N1:1}],
       ["Par le boulot ou les potes, quand ça tombe.",{N1:1}],
       ["Je rencontre personne. C'est bien le problème.",{N1:0}]]},

  /* ---- NIVEAU 2 : SÉDUIRE ---- */
  { q:"T'as engagé la conversation, elle est réceptive. La suite ?",
    o:[["Je prends le lead. Je propose un truc concret.",{N2:3}],
       ["Je continue de discuter, poliment. Et ça retombe.",{N2:1}],
       ["Je deviens très sympa. Très, très sympa.",{N2:0}],
       ["J'attends de voir si elle relance.",{N2:0}]]},
  { q:"Le moment où il faudrait qu'elle comprenne que tu la kiffes, pas que t'es cool :",
    o:[["Je le montre. Clairement.",{N2:3}],
       ["Je fais des allusions et j'espère qu'elle capte.",{N2:1}],
       ["Je fais l'ami. On verra plus tard.",{N2:0}],
       ["J'ose pas. Peur de casser le truc.",{N2:0}]]},
  { q:"Pendant que tu lui parles, t'as la tête où ?",
    o:[["Sur elle. Sur ce qu'elle dit.",{N2:3}],
       ["Sur ce que je vais dire juste après.",{N2:1}],
       ["Sur ce qu'elle est en train de penser de moi.",{N2:0}],
       ["Sur les gens autour, qui regardent.",{N2:0}]]},

  /* ---- NIVEAU 3 : FRÉQUENTER ---- */
  { q:"Elle répond moins vite que d'habitude. Tu fais quoi ?",
    o:[["Je continue ma vie. Je propose quand j'ai un truc à proposer.",{N3:3}],
       ["Je relis nos messages pour comprendre où ça a merdé.",{N3:1}],
       ["J'en fais plus. Je relance, j'insiste un peu.",{N3:0}],
       ["Je me ferme d'un coup. Tant pis pour elle.",{N3:0}]]},
  { q:"Après deux ou trois rendez-vous, en général, ça donne quoi ?",
    o:[["Ça avance. On sait tous les deux où on va.",{N3:3}],
       ["Ça stagne. On devient potes.",{N3:1}],
       ["Ça s'éteint et je sais jamais pourquoi.",{N3:0}],
       ["J'y arrive rarement, à deux ou trois rendez-vous.",{N3:0}]]},
  { q:"Ton humeur de la semaine, elle dépend de quoi ?",
    o:[["De ce que je fais de mes journées.",{N3:3}],
       ["Un peu de ses messages, je l'avoue.",{N3:1}],
       ["Beaucoup de ses messages.",{N3:0}],
       ["De si j'ai eu une preuve, cette semaine, que je vaux quelque chose.",{N3:0}]]},
];

/* ============ LES 3 NIVEAUX ============ */
const PROFILES = {
  N1:{ name:"Niveau 1 : provoquer", tag:"Là où tu bloques",
    title:["Tu rates pas les femmes. ","Tu les rencontres pas","."],
    body:"Ton blocage est tout au début : tu provoques rien. Tu croises des femmes qui te plaisent, tu le sais sur le moment, et tu laisses passer. Après tu te racontes que c'était pas le bon moment, pas le bon endroit, pas la bonne fille. C'est jamais le bon moment. Tant que ce premier pas est pas réglé, tout le reste sert à rien : tu peux devenir le mec le plus intéressant du monde, personne le saura.",
    punch:"Le problème c'est pas ce que tu dirais. C'est que tu y vas pas.",
    plan:["Cette semaine, va parler à une seule inconnue. Pas pour la séduire. Juste pour prouver que tu peux traverser les dix secondes.","Fixe-toi la règle des trois secondes : tu la vois, tu y vas. Passé trois secondes, ton cerveau invente une excuse.","Note après chaque tentative ce que t'as ressenti, pas si ça a marché. C'est ça qu'on entraîne."] },
  N2:{ name:"Niveau 2 : séduire", tag:"Là où tu bloques",
    title:["T'arrives à parler. ","Après, ça meurt","."],
    body:"Tu sais engager. Le problème arrive juste après : tu restes gentil. Tu discutes bien, elle rigole, et il se passe rien. Tu montres jamais que tu la kiffes, tu prends jamais le lead, tu attends qu'elle fasse le pas. Résultat : elle te trouve sympa, et sympa c'est le mot qui tue. La séduction c'est pas être aimable, c'est oser être un homme qui veut quelque chose.",
    punch:"Elle a pas besoin de te trouver cool. Elle a besoin de sentir que tu la veux, elle.",
    plan:["La prochaine conversation, propose un truc concret avant la fin. Un lieu, un jour. Pas « on se refait ça ».","Entraîne-toi à dire une phrase qui montre que tu la kiffes, sans blague pour te protéger derrière.","Arrête de meubler. Le silence te fait plus peur qu'à elle."] },
  N3:{ name:"Niveau 3 : fréquenter", tag:"Là où tu bloques",
    title:["Tu provoques, tu séduis. ","Et tu perds","."],
    body:"Le début, tu gères. C'est après que ça t'échappe. Dès qu'elle compte un peu, tu bascules : tu relis les messages, tu calcules, ton humeur suit ses réponses. Ou l'inverse : tu te fermes d'un coup pour pas souffrir. Dans les deux cas c'est le même moteur, le besoin qu'elle valide. Et elle le sent avant toi.",
    punch:"Tant que ta semaine dépend de ses messages, c'est pas une relation. C'est une attente.",
    plan:["Cette semaine, décide d'un truc pour toi qui dépend d'aucune femme. Et fais-le.","Quand tu veux relancer par angoisse, attends. Pas pour jouer un jeu, pour voir ce qui se passe en toi.","Repère le moment exact où tu passes de « je vis ma vie » à « j'attends sa réponse ». C'est là que tout se joue."] },
  ALL:{ name:"Les trois tiennent", tag:"Ton résultat",
    title:["Sur le papier, ","tu maîtrises les trois","."],
    body:"Tes réponses disent que tu provoques, que tu prends le lead, et que ta vie dépend pas de ses messages. Si c'est vrai, tant mieux, sincèrement. Alors la seule question qui vaut, c'est pourquoi t'as fait ce test. Soit t'es curieux. Soit y a un écart entre ce que tu réponds tranquille devant ton écran et ce qui se passe vraiment quand elle est là, en face.",
    punch:"On répond toujours mieux à un test qu'à une femme qui te plaît.",
    plan:["Vérifie sur le terrain, pas dans ta tête. Cette semaine, une seule interaction réelle.","Si t'y arrives : super, ton problème est ailleurs, cherche là.","Si t'y arrives pas : t'as ta réponse, et elle est pas dans ce test."] },
};


/* ============ PLAN COMPLET (affiche apres saisie de l'email) ============
   Un socle par niveau + des blocs qui se declenchent selon les reponses exactes.
   Regle : rien de generique. Chaque ligne doit etre faisable dans la semaine. */
const FULL = {
  N1:{
    why:"Tu bloques au niveau 1 parce que tes réponses disent la même chose sous trois formes : tu vois, tu sais, et tu y vas pas. C'est pas un problème de méthode. C'est les dix secondes entre le moment où tu la vois et le moment où ton cerveau te trouve une sortie.",
    days:[
      ["Jour 1","Sors trente minutes. Parle à trois inconnus, n'importe lesquels : un mec, une vieille dame, un vendeur. Une phrase suffit. Le but c'est pas de séduire, c'est de casser l'idée que parler à quelqu'un qu'on connaît pas, c'est un événement."],
      ["Jour 2","Repos. Le soir, note les moments de la journée où t'as croisé quelqu'un qui te plaisait sans y aller. Écris juste l'heure et le lieu. Tu vas être surpris du nombre."],
      ["Jour 3","Règle des trois secondes : tu la vois, tu y vas dans les trois secondes. Une seule fois dans la journée. Ce que tu dis n'a aucune importance. Ce qui compte c'est que tes jambes bougent avant ta tête."],
      ["Jour 4","Deux fois. Même règle. Tu vas remarquer que la deuxième est déjà plus facile que la première d'hier."],
      ["Jour 5","Repos. Relis tes notes du jour 2."],
      ["Jour 6","Trois fois. Et cette fois, reste trente secondes de plus que ce qui est confortable. C'est là que tout se joue, pas au bonjour."],
      ["Jour 7","Bilan. Compte le nombre de fois où t'as eu peur avant. Compte le nombre de fois où il s'est passé un truc grave. Regarde le score."]
    ],
    exit:"Tu sais que c'est débloqué quand t'as plus besoin d'une raison pour y aller. Pas quand ça marche : quand t'y vas.",
    trap:"L'erreur classique à ce niveau, c'est de préparer. Tu cherches la bonne phrase, le bon contexte, le bon moment. La préparation, à ce stade, c'est juste de l'évitement bien habillé."
  },
  N2:{
    why:"Tu bloques au niveau 2 parce que t'as réglé le plus dur (y aller) et que tu t'arrêtes juste avant le moment qui compte. Tu discutes bien. Mais discuter, c'est pas séduire. À un moment il faut qu'elle sache que tu la kiffes, et que tu proposes quelque chose.",
    days:[
      ["Jour 1","Choisis ta phrase d'intérêt. Une seule, courte, que tu peux dire sans blague derrière pour te protéger. Écris-la. Dis-la à voix haute jusqu'à ce qu'elle sonne normale."],
      ["Jour 2","Une conversation, et tu la termines en proposant un truc concret : un lieu, un jour. Pas « on se refait ça ». Même si elle dit non, l'exercice est réussi."],
      ["Jour 3","Le silence. Dans ta prochaine conversation, laisse trois secondes de blanc sans meubler. Compte-les dans ta tête. Le silence te fait plus peur qu'à elle."],
      ["Jour 4","Rejoue le jour 2. Deux fois."],
      ["Jour 5","Repos. Note le moment exact où t'es redevenu « sympa ». Il y en a toujours un, et il est toujours au même endroit."],
      ["Jour 6","Une conversation où tu dis ce que tu penses vraiment, même si ça peut lui déplaire. Un désaccord, un avis tranché. Tu vas voir que ça attire au lieu de casser."],
      ["Jour 7","Bilan. Combien de propositions concrètes cette semaine ? Si c'est zéro, c'est ça ton vrai blocage, pas ce que tu dis."]
    ],
    exit:"Tu sais que c'est débloqué quand tu proposes sans attendre le signal. Le signal arrive jamais, c'est ça le piège.",
    trap:"L'erreur classique à ce niveau, c'est d'être formidable. Drôle, cultivé, attentionné. Elle te trouve super. Et il se passe rien, parce qu'à aucun moment t'as pris le risque de vouloir quelque chose."
  },
  N3:{
    why:"Tu bloques au niveau 3 parce que tu sais provoquer et tu sais séduire, mais dès qu'elle compte un peu, tu bascules. Ton humeur suit ses réponses, ou tu te fermes d'un coup pour prendre les devants. C'est le même moteur : le besoin qu'elle valide. Et ça, elle le sent avant toi.",
    days:[
      ["Jour 1","Écris les trois trucs de ta semaine qui dépendent d'aucune femme. Un truc physique, un truc que tu construis, un truc avec des potes. Bloque-les dans ton agenda maintenant."],
      ["Jour 2","Zéro relance par angoisse. Si t'as envie d'écrire, attends deux heures et regarde si t'as encore envie. La plupart du temps non : c'était pas elle que tu voulais, c'était être rassuré."],
      ["Jour 3","Fais le premier des trois trucs. En entier."],
      ["Jour 4","Si t'échanges avec quelqu'un, propose une vraie date au lieu de continuer à discuter. Les conversations qui durent, c'est des conversations qui remplacent."],
      ["Jour 5","Note ton humeur au réveil, et le nombre de messages que t'as reçus la veille. Fais-le sans tricher."],
      ["Jour 6","Le deuxième truc."],
      ["Jour 7","Relis tes notes du jour 5. Ton humeur a suivi ta semaine, ou ses réponses ? Tu vas avoir ta réponse en trente secondes."]
    ],
    exit:"Tu sais que c'est débloqué quand ta semaine ne dépend plus de sa réponse. Pas quand tu t'en fous : quand ça change plus ta journée.",
    trap:"L'erreur classique à ce niveau, c'est de jouer un jeu. Répondre en retard exprès, faire semblant d'être occupé. Ça marche deux semaines, et ça t'épuise, parce que t'as toujours le compteur dans la tête. La différence entre être occupé et faire semblant, elle la sent."
  },
  ALL:{
    why:"Tes réponses disent que les trois tiennent. Soit c'est vrai, soit y a un écart entre ce que tu réponds tranquille devant ton écran et ce qui se passe quand elle est là, en face. Ce plan-là sert à trancher, pas à te rassurer.",
    days:[
      ["Jour 1","Une seule interaction réelle avec une inconnue qui te plaît. Pas un test mental. Une vraie."],
      ["Jour 2","Note ce qui s'est passé dans ton corps avant d'y aller. Si la réponse est « rien », le niveau 1 est vraiment réglé."],
      ["Jour 3","Propose un truc concret à quelqu'un. Regarde si tu le fais sans négocier avec toi-même."],
      ["Jour 4","Repos."],
      ["Jour 5","Une semaine sans consulter tes messages pour vérifier une réponse. Compte les rechutes."],
      ["Jour 6","Refais le jour 1. Le deuxième passage dit la vérité, pas le premier."],
      ["Jour 7","Si les trois exercices sont passés sans accroc : ton blocage est ailleurs, et c'est pas de la séduction qu'il te faut. Si un des trois a coincé, t'as ton vrai niveau."]
    ],
    exit:"Le test se répond mieux qu'une femme qui te plaît. C'est le terrain qui tranche.",
    trap:"L'erreur, à ce stade, c'est de continuer à apprendre. T'as pas un problème d'information."
  }
};

/* Blocs declenches par une reponse precise : [indexQuestion, indexOption] */
const EXTRAS = [
  {q:0,o:2,t:["La rumination du soir","Repenser à elle le soir, c'est pas de la nostalgie, c'est ton cerveau qui rejoue la scène pour la finir. Il la finira jamais. La seule façon de fermer la boucle, c'est d'y aller la prochaine fois, même mal."]},
  {q:0,o:3,t:["L'excuse du timing","« C'est pas le bon moment » revient à chaque fois, et c'est jamais la même raison. Quand une excuse change de forme mais pas de fonction, c'est pas une excuse : c'est une peur avec un bon avocat."]},
  {q:1,o:4,t:["T'as jamais abordé personne","Alors commence encore plus bas que le plan : cette semaine, parle à des gens qui te plaisent pas. Un serveur, un mec dans la file. Ton problème c'est pas les femmes, c'est parler à un inconnu. Règle ça d'abord, ça prend trois jours."]},
  {q:2,o:1,t:["Les applications","Elles te donnent l'impression d'agir sans jamais t'exposer. Tu peux swiper deux ans et pas progresser d'un millimètre, parce que t'as jamais eu à gérer un regard en face. Garde-les si tu veux, mais compte-les pour zéro."]},
  {q:3,o:2,t:["La trappe du gentil","Être très sympa, c'est une stratégie d'évitement : si t'es irréprochable, tu peux pas être rejeté pour ce que tu veux, vu que t'as rien demandé. Le coût, c'est qu'elle sait jamais que t'es intéressé."]},
  {q:4,o:2,t:["L'ami qui attend","Faire l'ami en espérant que ça bascule plus tard, ça bascule jamais. Le cadre se fige dans les premières heures. Plus t'attends, plus le dire devient un aveu bizarre au lieu d'être une évidence."]},
  {q:5,o:2,t:["Sortir de ta tête","Penser à ce qu'elle pense de toi pendant que tu lui parles, c'est être à deux endroits en même temps. Elle voit un mec absent. L'exercice : pendant trente secondes, écoute-la vraiment, au point de pouvoir répéter sa dernière phrase."]},
  {q:5,o:3,t:["Le public imaginaire","Les gens autour te regardent pas. Et ceux qui regardent oublient dans les dix secondes. Le seul qui va se souvenir de la scène pendant des semaines, c'est toi."]},
  {q:6,o:2,t:["L'escalade","Quand elle répond moins et que t'en fais plus, tu confirmes exactement ce qu'elle est en train de sentir. Faire plus, c'est le seul geste qui accélère la fin."]},
  {q:6,o:3,t:["La fermeture d'un coup","Te fermer avant d'être lâché, c'est pas de la fierté, c'est un moyen de choisir le moment de la douleur. Le prix, c'est que t'as jamais su ce qui se serait passé."]},
  {q:7,o:1,t:["Le palier ami","Ça stagne parce que rien a été posé. Une relation qui avance pas, c'est presque toujours une relation où personne a dit ce qu'il voulait."]},
  {q:8,o:2,t:["L'humeur sous-traitée","Quand ton humeur dépend de ses messages, t'as confié la télécommande à quelqu'un qui sait même pas qu'il l'a. C'est le truc le plus épuisant du lot, et c'est le premier à traiter."]},
  {q:8,o:3,t:["Le besoin de preuve","Chercher chaque semaine une preuve que tu vaux quelque chose, ça veut dire que la preuve tient pas plus d'une semaine. Aucune femme peut remplir ça. C'est pour ça qu'on travaille sur toi d'abord."]}
];
function extrasFor(){
  const out=[];
  EXTRAS.forEach(function(x){ if(answers[x.q]===x.o) out.push(x.t); });
  return out.slice(0,3);
}

/* ============ ÉTAT ============ */
let step = -1;
const answers = [];
let quizStarted = false;
let quizCompleted = false;
/* Ordre d'affichage melange par question : evite que la "bonne" reponse soit
   toujours en premier. Tire une fois par session, stable si on revient en arriere. */
let ORDER = [];
function shuffleOrders(){
  ORDER = Q.map(function(item){
    const a = item.o.map(function(_,i){ return i; });
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  });
}
const card = document.getElementById('card');
const prog = document.getElementById('progress');
const counter = document.getElementById('counter');
const clamp = (n,a,b)=> Math.max(a, Math.min(b, n));

function setProgress(){
  const pct = step < 0 ? 0 : Math.round((step)/(Q.length)*100);
  prog.style.width = pct + "%";
  counter.textContent = step < 0 ? "" : (step+1) + " / " + Q.length;
}

function intro(){
  step = -1; answers.length = 0; quizStarted = false; quizCompleted = false; shuffleOrders(); setProgress();
  card.className = "card reveal";
  card.innerHTML = `
    <div class="mono" style="margin-bottom:18px">Le test · 2 min · 9 questions</div>
    <h1>Tu bloques à<br><span class="grad">quel niveau</span> ?</h1>
    <p class="lead">Avec les femmes, il y a trois niveaux : <strong>provoquer la rencontre</strong>, <strong>séduire</strong>, et <strong>fréquenter</strong>. Presque tous les mecs bloquent sur un seul des trois, et bossent les deux autres pour rien. Neuf questions, et tu sais lequel c'est.</p>
    <p class="meta">Réponds sans te mentir. Personne te juge.</p>
    <button class="btn" onclick="go(0)">Je commence <span aria-hidden="true">&#8594;</span></button>`;
}

function render(){
  const item = Q[step];
  setProgress();
  card.className = "card reveal";
  const order = ORDER[step] || item.o.map((_,i)=>i);
  const opts = order.map(i=>`
    <button class="opt${answers[step]===i?' sel':''}" onclick="pick(${i})">
      <span class="dot"></span><span>${item.o[i][0]}</span>
    </button>`).join("");
  card.innerHTML = `
    <div class="qnum">Question ${step+1}</div>
    <div class="qtext">${item.q}</div>
    <div class="opts">${opts}</div>
    ${step>0?'<button class="back" onclick="go('+(step-1)+')">← Retour</button>':''}`;
}

function pick(i){
  answers[step] = i;
  trackEvent('quiz_question_answered',{question:step + 1,total:Q.length});
  setTimeout(()=>{ step+1 < Q.length ? go(step+1) : result(); }, 190);
}
function go(s){
  if(s === 0 && !quizStarted){ quizStarted = true; trackEvent('quiz_started',{questions:Q.length}); }
  step = s; render();
}

function score(){
  const t = {N1:0,N2:0,N3:0};
  answers.forEach((ai,qi)=>{ const m=Q[qi].o[ai][1]; for(const k in m) t[k]+=m[k]; });
  return t;
}
/* Le niveau qui bloque = le PREMIER des trois sous le seuil. Un niveau se debloque dans l'ordre. */
function levelKey(t){
  if(t.N1 < 6) return "N1";
  if(t.N2 < 6) return "N2";
  if(t.N3 < 6) return "N3";
  return "ALL";
}
function namedScores(t){
  return {
    n1: clamp(Math.round(t.N1/9*100), 4, 98),
    n2: clamp(Math.round(t.N2/9*100), 4, 98),
    n3: clamp(Math.round(t.N3/9*100), 4, 98),
  };
}

function result(){
  if(!quizCompleted){ quizCompleted = true; trackEvent('quiz_completed',{questions:Q.length}); }
  const t = score();
  const key = levelKey(t);
  const p = PROFILES[key];
  const s = namedScores(t);
  setProgress(); prog.style.width="100%"; counter.textContent="Résultat";
  card.className="card reveal";
  card.innerHTML = `
    <div class="badge">${p.tag}</div>
    <div class="rtitle">${p.name}</div>
    <div class="rsub">${p.title[0]}${p.title[1]}${p.title[2]}</div>

    <div class="scores">
      ${scoreBar("1 · Provoquer la rencontre", s.n1, key==="N1"?"warm":"indigo")}
      ${scoreBar("2 · Séduire", s.n2, key==="N2"?"warm":"indigo")}
      ${scoreBar("3 · Fréquenter", s.n3, key==="N3"?"warm":"indigo")}
    </div>
    <p class="lvlnote">Les trois se débloquent dans l'ordre. Celui qui compte, c'est le premier qui coince : tant qu'il est pas réglé, bosser les deux autres sert à rien.</p>

    <p class="rbody">${p.body}</p>
    <div class="punch">${p.punch}</div>

    <div class="plan">
      <h3>Ton plan pour cette semaine</h3>
      <ol>${p.plan.map(a=>`<li>${a}</li>`).join("")}</ol>
    </div>

    <div class="capture">
      <h3>Débloque le plan complet</h3>
      <p>Laisse ton email et le plan détaillé de ton niveau (<strong>${p.name}</strong>) s'affiche tout de suite.</p>
      <form id="capForm" onsubmit="return submitLead(event,'${key}')">
        <div class="frow">
          <input type="text" id="prenom" placeholder="Prénom" required autocomplete="given-name">
          <input type="text" id="nom" placeholder="Nom" required autocomplete="family-name">
        </div>
        <input type="email" id="email" placeholder="ton@email.com" required autocomplete="email">
        <label class="consent"><input type="checkbox" id="consentResult" required><span>J'accepte de recevoir mon diagnostic et d'être recontacté à ce sujet. <a href="cadre.html" target="_blank" rel="noopener">Confidentialité</a>.</span></label>
        <label class="consent"><input type="checkbox" id="consentMarketing"><span>Je veux recevoir les emails d'Allan. Je me désinscris quand je veux.</span></label>
        <button class="btn full" type="submit">Afficher mon plan complet</button>
      </form>
      <p class="fine">La deuxième case est facultative.</p>
    </div>
    <button class="back" style="margin-top:26px" onclick="intro()">↺ Refaire le test</button>`;
  requestAnimationFrame(()=>{ setTimeout(()=>{
    document.querySelectorAll('.sfill').forEach(el=> el.style.width = el.dataset.v + "%");
  }, 120); });
}

function scoreBar(label, val, cls){
  return `<div class="score">
    <div class="srow"><span class="slabel">${label}</span><span class="sval">${val}%</span></div>
    <div class="strack"><div class="sfill ${cls}" data-v="${val}"></div></div>
  </div>`;
}

function submitLead(e, key){
  e.preventDefault();
  const prenom = document.getElementById('prenom').value.trim();
  const nom = document.getElementById('nom').value.trim();
  const email = document.getElementById('email').value.trim();
  const consentResult = document.getElementById('consentResult').checked;
  const consentMarketing = document.getElementById('consentMarketing').checked;
  if(!email || email.indexOf('@')<0 || !prenom || !consentResult) return false;
  trackEvent('quiz_email_submitted',{marketing_opt_in:consentMarketing});
  const t = score(); const s = namedScores(t);
  const profil = PROFILES[key].name;
  const src = TRACKING.utm_source || "site-direct";
  const clean = value=>String(value||'').replace(/[|\r\n<>]/g,' ').trim();

  const submit = document.querySelector('#capForm button[type="submit"]');
  if(submit){ submit.disabled=true; submit.textContent="Un instant…"; }

  if(LEAD_ENDPOINT){
    let settled=false;
    const show=(captured)=>{
      if(settled) return;
      settled=true;
      success(key, prenom, captured);
    };
    fetch(LEAD_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        _subject:`Nouveau lead quiz : ${prenom} ${nom} (${profil})`,
        prenom, nom, email, profil,
        niveau_1:s.n1, niveau_2:s.n2, niveau_3:s.n3, source:src,
        consentement_emails:consentMarketing?'oui':'non',
        utm_source:TRACKING.utm_source,utm_medium:TRACKING.utm_medium,utm_campaign:TRACKING.utm_campaign,utm_content:TRACKING.utm_content,utm_term:TRACKING.utm_term,
        lead_data:`LEADV4|${clean(email)}|${clean(prenom)}|${clean(nom)}|${clean(profil)}|${s.n1}|${s.n2}|${s.n3}|${consentMarketing?'1':'0'}|${clean(TRACKING.utm_source)}|${clean(TRACKING.utm_medium)}|${clean(TRACKING.utm_campaign)}|${clean(TRACKING.utm_content)}|${clean(TRACKING.utm_term)}|quiz`
      })
    }).then(response=>show(response.ok)).catch(()=>show(false));
    setTimeout(()=>show(null), 4500);
  }else{
    success(key, prenom, false);
  }
  return false;
}

function success(key, prenom, captured){
  trackEvent('quiz_plan_unlocked',{email_delivery_confirmed:captured === true});
  const p = PROFILES[key];
  const full = FULL[key];
  const extras = extrasFor();
  const captureStatus = captured === true
    ? "Tes réponses ont bien été enregistrées. Ton plan complet est juste dessous."
    : captured === false
      ? "Ton plan est disponible. La connexion n'a pas permis de confirmer l'enregistrement de ton email."
      : "Ton plan est disponible. Le réseau n'a pas encore confirmé l'enregistrement de ton email.";
  card.className="card reveal";
  card.innerHTML = `
    <div class="ok">
      <div class="check">✓</div>
      <div class="rtitle" style="font-size:clamp(1.6rem,5.5vw,2.2rem)">Ton plan est débloqué.</div>
      <p class="capture-status">${captureStatus}</p>
    </div>

    <div class="fullplan">
      <section class="diagnosis">
        <h3>Pourquoi tu bloques ici</h3>
        <p>${full.why}</p>
      </section>

      <section class="week">
        <h3>Les 7 prochains jours</h3>
        <ol>${full.days.map(day=>`<li><strong>${day[0]}</strong><span>${day[1]}</span></li>`).join("")}</ol>
      </section>

      ${extras.length ? `<section class="signals">
        <h3>Ce que tes réponses montrent aussi</h3>
        ${extras.map(x=>`<div class="signal"><h4>${x[0]}</h4><p>${x[1]}</p></div>`).join("")}
      </section>` : ""}

      <section class="signals">
        <div class="signal"><h4>Le piège à éviter</h4><p>${full.trap}</p></div>
        <div class="signal"><h4>Comment savoir que ce niveau est débloqué</h4><p>${full.exit}</p></div>
      </section>

      <div class="punch">Si tu veux aller beaucoup plus vite, on peut travailler ce niveau ensemble, en immersion. D'abord, on prend 45 minutes pour comprendre ta situation. Je te fais une offre seulement si le format est cohérent pour toi.</div>
      <div style="text-align:center;margin-top:24px"><a class="btn" href="${trackedBookUrl('quiz-result')}" data-cal-link="allan-figfsv/appel-confiance-offert" data-cal-namespace="appel-confiance-offert" data-cal-config='{"layout":"month_view"}' data-analytics-placement="quiz-result">Candidater à l'immersion →</a></div>
      <div style="text-align:center;margin-top:26px"><a href="index.html" class="mono" style="letter-spacing:.1em;color:var(--text-dim)">← Revenir au site</a></div>
    </div>`;
  window.scrollTo({top:0,behavior:"smooth"});
}

intro();
