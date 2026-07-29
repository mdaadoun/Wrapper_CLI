# 📌 Session : Phase 3.3 — Orchestrateur d'Ingestion (Pattern Façade)
**Date :** 29 Juillet 2026

Mise en œuvre de la fonction façade `extract(source, source_type)` dans `core/extractor.py` qui redirige vers l'extracteur interne approprié selon le `SourceType`, avec une validation Pydantic garantissant un résultat non vide.

---

### 1. 🎓 Nouveaux Concepts Introduits

*   **Pattern Façade (Facade Pattern) :** Patron de conception structurel fournissant une interface simplifiée et unifiée à un sous-système complexe. Ici, `extract()` masque la complexité des trois extracteurs distincts (texte, fichier, URL) derrière un appel de fonction unique.
*   **Couche de Validation Pydantic :** Utilisation de `BaseModel` avec `Field(min_length=1)` pour appliquer des règles métier aux limites du système — garantissant que tout contenu extrait retourné à l'appelant n'est pas vide, en capturant les cas limites au plus tôt.
*   **Routage style Factory (Factory-style Dispatch) :** La fonction `extract()` utilise une chaîne `if/elif/else` basée sur l'énumération `SourceType` pour rediriger vers le bon extracteur, une forme légère du pattern Stratégie sans nécessiter de registre.

---

### 2. 🧠 Décisions & Choix Techniques

#### Décision A : Façade vs. Exposition Directe des Extracteurs
*   **Option A.1 : Exposition directe de `extract_from_text`, `extract_from_file`, `extract_from_url`**
    *   *Avantages / Inconvénients :* Les appelants doivent savoir quel extracteur appeler et gérer le routage eux-mêmes. Viole le principe DRY si répété à travers la codebase.
*   **Option A.2 : Façade unifiée `extract()` (Retenue)**
    *   *Pourquoi ce choix ?* Centralise la logique de routage en un seul endroit, applique la validation Pydantic de manière cohérente et fournit un import unique pour l'ensemble du pipeline d'ingestion. L'appelant (ex: `main.py`) appelle simplement `extract(source, source_type)` sans connaître l'architecture interne.

#### Décision B : Validation Pydantic vs. Simple Vérification `len()`
*   **Option B.1 : Simple `if not cleaned: raise EmptySourceError`**
    *   *Avantages / Inconvénients :* Fonctionne mais manque de garanties au niveau du schéma et d'exposition des métadonnées.
*   **Option B.2 : Modèle Pydantic `ExtractedContent` avec `Field(min_length=1)` (Retenue)**
    *   *Pourquoi ce choix ?* Fournit une validation déclarative au niveau du schéma, applique automatiquement les contraintes et conserve les métadonnées (char_count, source_type) aux côtés du texte extrait. Respecte la philosophie de typage strict du projet.

---

### 3. 🛠️ Implémentation & Auto-Documentation

La fonction `extract()` dans `core/extractor.py` implémente le pattern façade :

```python
def extract(source: str, source_type: SourceType) -> str:
    # 1. Redirection vers le bon extracteur interne
    if source_type == SourceType.TEXT:
        raw = extract_from_text(source)
    elif source_type == SourceType.FILE:
        raw = extract_from_file(Path(source))
    elif source_type == SourceType.URL:
        raw = extract_from_url(source)
    else:
        raise ExtractionError(f"Unknown source type: {source_type}")

    # 2. Validation Pydantic — garantit un résultat non vide
    validated = ExtractedContent.from_text(raw, source_type)
    return validated.text
```

Le modèle `ExtractedContent` valide :
- `text` : chaîne non vide (`min_length=1`)
- `source_type` : énumération `SourceType` valide
- `char_count` : entier >= 1

La méthode de classe `from_text()` exécute la logique de validation et lève `EmptySourceError` si le contenu est vide après nettoyage.

#### Commandes de validation :
```bash
# Exécuter tous les tests d'extracteur incluant les tests de la façade
make test -k extractor
# Ou la suite complète
make test
```

---

#### Tests ajoutés :

- `test_extract_facade_text` — La source TEXT est correctement redirigée
- `test_extract_facade_text_empty_raises` — Un TEXT vide lève `EmptySourceError`
- `test_extract_facade_file` — La source FILE est correctement redirigée
- `test_extract_facade_file_missing_raises` — Un FILE manquant lève `ExtractionError`
- `test_extract_facade_url` — La source URL est correctement redirigée
- `test_extract_facade_url_empty_raises` — Un contenu URL vide lève `EmptySourceError`
- `test_extract_facade_pydantic_validation` — Le type de retour est un `str` validé

---

### 4. 📌 Synthèse de la Session

1.  **Fonction Façade :** `extract()` dans `core/extractor.py` redirige correctement vers les 3 types de sources (TEXT, FILE, URL).
2.  **Validation Pydantic :** Le modèle `ExtractedContent` valide la présence de contenu non vide et lève `EmptySourceError` si le texte nettoyé est vide.
3.  **Couverture de Tests :** 17 tests réussis avec 95% de couverture de code sur `core/extractor.py`. Les 3 types de sources sont testés pour les cas de succès et les cas limites de contenu vide.
4.  **Conformité Mypy :** `extractor.py` passe le contrôle de typage strict Mypy avec zéro erreur.
