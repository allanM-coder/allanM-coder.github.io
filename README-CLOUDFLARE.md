# Copie Cloudflare de test

Cette branche conserve la copie publique du site et le pont direct vers Brevo.

- `worker/index.js` reçoit le quiz et les webhooks Cal.com.
- Les secrets Brevo et Cal.com sont stockés dans Cloudflare, jamais dans GitHub.
- `main` reste la production GitHub Pages tant que la copie Cloudflare n'est pas validée.
- `index-bis.html`, `index-c.html`, les archives, la QA, les documents et les sources privées ne doivent jamais être ajoutés à cette branche.

Le déploiement de test utilise le Worker `allan-coaching-preview`. Toute mise en production sur un domaine personnel exige une validation séparée.
