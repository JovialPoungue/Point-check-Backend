# PointCheck — Améliorations & fonctionnalités IA

Ce document récapitule les modifications apportées au projet.

## 1. Sécurité

- **Configuration par environnement** (`settings.py`) : `SECRET_KEY`, `DEBUG`,
  `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `DATABASE_URL` lus depuis l'environnement.
  Voir `.env.example`. En production (`DEBUG=False`), activation automatique de
  `SECURE_SSL_REDIRECT`, cookies sécurisés, en-tête proxy HTTPS.
- **Repli SQLite** en local quand `DATABASE_URL` est absent (plus besoin de Postgres
  pour développer).
- **Code PIN hashé** : le PIN n'est plus stocké ni renvoyé en clair.
  - `User.set_pin()` / `User.check_pin()` / `User.has_pin` (hash Django).
  - Migration `accounts/0002_pin_hash.py` (champ élargi à 128).
  - `UserDetailSerializer` n'expose plus le PIN, seulement `has_pin` (booléen).
  - Nouvelle action API `POST /api/auth/users/{id}/set_pin/`.
  - PIN en lecture seule dans l'admin Django.
- **Anti-brute-force** : throttling DRF (`ScopedRateThrottle`).
  - Pointage public : `20/min` par IP.
  - Assistant IA : `15/min`. Synthèse RH : `6/min`.
- Le PIN est désormais **obligatoire** au pointage dès qu'il est configuré.

## 2. Corrections de bugs

- **QR Code (`QRDisplayPage.jsx`)** : correction du compte à rebours qui se
  resynchronise mal (capture de variable périmée). Suppression d'un `console.log`.
- **Suivi des absences** : nouvelle commande `close_daily_attendance` qui crée les
  lignes `DailyAttendance` manquantes et marque ABSENT / WEEKEND / ON_LEAVE.
  Les statistiques d'absence sont enfin correctes.
- **Calculs journaliers** (`update_daily_attendance`) :
  - durée des pauses réellement calculée (paires `break_start`/`break_end`) ;
  - heures travaillées = présence − pauses ;
  - heures supplémentaires calculées vs journée théorique ;
  - correction de la double application de la tolérance de retard.
- `requirements.txt` : `dotenv` → `python-dotenv`. Suppression de `get-pip.py`.

### Planifier la clôture quotidienne

```bash
python manage.py close_daily_attendance            # traite hier
python manage.py close_daily_attendance --days 7   # 7 derniers jours
python manage.py close_daily_attendance --date 2026-06-19
```

À exécuter chaque nuit via cron, GitHub Actions, Celery beat ou un worker.

## 3. Fonctionnalités IA (nouvelle app `apps/insights`)

Toutes les données envoyées à l'IA sont **calculées côté serveur** et **cloisonnées
par entreprise et par rôle** (un manager ne voit que son département). Le modèle ne
peut pas inventer de chiffres : il ne reçoit que l'instantané analytique factuel.

### a) Assistant analytique en langage naturel
- `POST /api/insights/query/` — question libre, réponse fondée sur les données.
- Frontend : composant `AIAssistant` (chat) intégré au tableau de bord.

### b) Génération automatique de synthèses RH
- `POST /api/insights/hr-synthesis/` — rapport RH narratif (résumé, présence,
  points d'attention, congés, recommandations).
- **Mode dégradé** : sans clé IA, une synthèse déterministe (template) est produite,
  donc la fonctionnalité reste démontrable.
- Frontend : composant `HRSynthesis` (génération, copie, téléchargement .txt).

- `GET /api/insights/status/` — indique si l'IA est configurée.

### Configuration IA
Variables d'environnement (voir `.env.example`) :
```
AI_PROVIDER=anthropic        # ou "openai" (tout endpoint compatible)
AI_API_KEY=...               # vide => assistant désactivé, synthèse en template
AI_MODEL=claude-sonnet-4-6
# AI_BASE_URL=               # override proxy / endpoint compatible
```
Le client (`apps/insights/llm.py`) n'utilise que la bibliothèque standard
(`urllib`), donc aucune dépendance supplémentaire à installer.

## 4. Accès réservé

Les endpoints IA sont réservés aux rôles **admin** et **manager**
(les employés reçoivent 403).
