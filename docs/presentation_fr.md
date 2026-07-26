# 🚀 Présentation : Wrapper CLI de Veille IA Automatisée

## Qu'est-ce que le Wrapper CLI ?

Le **Wrapper CLI de Veille IA** (Projet 3) est un outil en ligne de commande industriel, résilient, typé et hautement configurable en Python. Il automatise la capture, l'analyse d'impact et la synthèse d'actualités technologiques (textes bruts, fichiers locaux ou URLs d'actualités tech) par l'intermédiaire de LLM.

Conçu selon les standards d'ingénierie **AI Product Engineering (AIPE)**, cet outil intègre un contrôle strict FinOps (calcul au jeton près, estimation budgétaire en USD), une persistance par cache local, et une tolérance totale aux pannes réseau.

---

## 🎯 Les Objectifs Stratégiques (Valeur Produit & ROI)

### 1. Gain de Temps & Veille Automatisée
*   **Problème :** Une équipe produit passe des heures par jour à éplucher manuellement les dépêches, blogs et flux RSS pour suivre l'actualité de l'IA.
*   **Solution Wrapper CLI :** Analyse et synthèse automatique de toute source textuelle en **moins de 15 secondes** avec structuration des impacts (technique, business, réglementaire).

### 2. Maîtrise des Coûts & Intelligence FinOps
*   **Problème :** Les interfaces web ne permettent pas de mesurer l'impact financier précis ni la consommation de tokens des requêtes.
*   **Solution Wrapper CLI :** Calculateur de coût temps réel en USD et système de cache local par hachage SHA-256 évitant tout traitement redondant.

### 3. Résilience & Intégration CI/CD
*   **Problème :** Les micro-coupures réseau et limites d'API (Rate Limits HTTP 429) font crasher les scripts artisanaux.
*   **Solution Wrapper CLI :** Politique de retry automatique avec backoff exponentiel (Tenacity), formats d'export multiples (Console Rich, JSON, Markdown) et conteneurisation Docker.

---

## 🏗️ Architecture du Pipeline

```text
  [Source Input] (Texte / Fichier / URL)
         │
         ▼
 ┌─────────────────┐      Cache Hit?
 │ Extractor Module│ ──────────────────────► [Rapport en Cache]
 └────────┬────────┘                             │
          │ Cache Miss                           ▼
          ▼                              ┌──────────────────┐
 ┌─────────────────┐                     │ Console Rich UI  │
 │ LLM Client +    │ ───────────────────►│ Export JSON / MD │
 │ Retry Tenacity  │   AnalysisReport    └──────────────────┘
 └─────────────────┘
```
