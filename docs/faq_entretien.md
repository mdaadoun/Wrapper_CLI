# ❓ FAQ Entretien : Wrapper CLI de Veille IA

Questions-réponses clés pour défendre l'architecture et les choix d'ingénierie du **Projet 3 : Wrapper CLI** lors d'un entretien technique.

---

### Q1 : Pourquoi avoir choisi Typer plutôt que argparse natif ou Click ?
**Réponse :** Typer s'appuie sur le typage statique moderne de Python (Type Hints). Il permet de déclarer la CLI de façon expressive et de générer automatiquement la validation des arguments, la conversion des types et l'aide `--help` sans code boilerplate, tout en reposant sur la maturité de Click en sous-couche.

### Q2 : Comment garantissez-vous que le LLM retourne un format JSON valide ?
**Réponse :** Nous combinons trois niveaux de sécurité :
1. Un prompt système d'ingénierie stricte spécifiant le schéma de sortie attendu.
2. Le mode *Structured Outputs* / `response_format` du SDK API.
3. La validation stricte à la réception via un modèle **Pydantic V2** (`AnalysisReport.model_validate_json()`). En cas d'erreur de parsing, une exception personnalisée est levée.

### Q3 : Comment avez-vous abordé la question de la résilience réseau (Rate Limits, coupures) ?
**Réponse :** Nous utilisons la bibliothèque **Tenacity** avec une stratégie de **backoff exponentiel enrichi de jitter** (jusqu'à 4 tentatives max). En cas d'erreur transitoire (HTTP 429 ou 5xx), l'application émet un log d'avertissement et retient la requête de façon progressive sans interrompre prématurément le thread. Si la panne persiste, elle échoue proprement avec un code de sortie `1` et un message clair sans exposer de traceback technique.

### Q4 : Quel est votre mécanisme de contrôle des coûts (FinOps) ?
**Réponse :**
1. **Mesure directe** : Extraction des compteurs de tokens (`prompt` et `completion`) et calcul du coût exact en USD basé sur les tarifs au million de tokens.
2. **Système de cache local** : Hachage SHA-256 du contenu d'entrée avec TTL configurable pour éviter de re-traiter les contenus identiques.
3. **Limitation explicite** : Utilisation du paramètre `max_tokens` pour brider la longueur des réponses générées.

### Q5 : Pourquoi utiliser un build Docker multi-stage non-root pour un outil CLI ?
**Réponse :** Le build multi-stage sépare la phase d'installation des outils de compilation (Poetry, pip) du runtime final, réduisant le poids de l'image (de ~600 Mo à < 250 Mo). L'exécution sous un utilisateur non-privilégié `appuser` (UID 1000) respecte le principe de moindre privilège pour une utilisation sécurisée en conteneur CI/CD.
