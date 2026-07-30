# Journal de Dév Session 8.2 : Gestion Gracieuse des Erreurs & Codes de Sortie

**Date:** 2026-07-30

Mise en œuvre d'une gestion gracieuse des erreurs, d'un formatage visuel en panneau rouge avec Rich (`display_error`) et de codes de sortie POSIX contrôlés (`1`) lors de pannes réseau et d'erreurs de domaine sans exposer les tracebacks Python bruts.

---

### 1. Concepts Introduits

- **Gestion Gracieuse des Erreurs (Graceful Failure)** : Capture des exceptions du domaine et des erreurs d'exécution génériques aux frontières du CLI afin d'éviter l'affichage de tracebacks Python internes dans le terminal.
- **Panneau d'Erreur Rich (`display_error`)** : Composant UI Rich rouge standardisé affichant un titre et le message d'erreur formaté sur `stderr`.
- **Code de Sortie POSIX Déterministe** : Renvoi systématique du code de sortie `1` en cas d'échec pour permettre la détection d'erreurs dans les scripts d'automatisation et pipelines CI/CD.

---

### 2. Décisions d'Architecture (ADR)

#### ADR 1 : Gestion Centralisée des Exceptions au Point d'Entrée CLI (`main.py`)
- **Option 1** : Laisser Python imprimer les tracebacks non gérés sur stderr en cas d'erreur.
- **Option 2 (Sélectionnée)** : Envelopper la commande `scan` dans des blocs `try...except` attrapant `WatcherError` et `Exception`, déléguer le rendu à `display_error` et lever `typer.Exit(code=1)`.
- **Justification** : Masque les chemins de fichiers internes et détails d'implémentation, offre une expérience utilisateur soignée et respecte les conventions POSIX.

#### ADR 2 : Rendu d'Erreur Délégué (`display_error` dans `console.py`)
- **Option 1** : Utiliser un simple affichage texte rouge via `typer.secho`.
- **Option 2 (Sélectionnée)** : Implémenter `display_error` dans `formatters/console.py` avec un `Panel` Rich à bordure rouge ciblant `stderr`.
- **Justification** : Garantit une cohérence visuelle parfaite avec le système de design Rich de l'application.

---

### 3. Implémentation & Code

Voir `src/ai_watcher/formatters/console.py`, `src/ai_watcher/main.py`, `src/ai_watcher/clients/llm_client.py` et `tests/test_graceful_failure.py`.

---

### 4. Checklist & Livrables

- [x] Implémentation du formateur `display_error` en panneau Rich sur stderr.
- [x] Gestion centralisée des exceptions dans la commande `scan` (`WatcherError` et `Exception`).
- [x] Formatage des erreurs `LLMRetryableError` après 4 tentatives avec le préfixe `❌ Failed after 4 attempts`.
- [x] Ajout de tests unitaires complets dans `tests/test_graceful_failure.py`.
- [x] Enregistrement de la suite de tests dans le lanceur du dashboard Next.js.
