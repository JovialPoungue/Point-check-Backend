"""
Logique métier des fonctionnalités IA :
  - answer_question        : assistant analytique en langage naturel ;
  - generate_hr_synthesis  : génération d'une synthèse RH narrative.

Les deux s'appuient sur un contexte factuel (context.build_analytics_context)
calculé côté serveur. Le LLM ne voit QUE ce contexte : il ne peut pas inventer
de chiffres ni accéder à d'autres entreprises.

Sans clé IA configurée, generate_hr_synthesis bascule sur une synthèse
déterministe (template) pour rester utilisable en démonstration.
"""
import json
from . import context as ctx
from . import llm

# --- Prompts ---

ASSISTANT_SYSTEM = """Tu es l'assistant analytique RH de PointCheck, une plateforme \
de gestion de présence des employés.

Règles strictes :
- Réponds UNIQUEMENT à partir des données JSON fournies dans le message. \
N'invente jamais de chiffres, de noms ou de tendances absents des données.
- Si l'information demandée n'est pas dans les données, dis-le clairement et \
indique ce qui serait nécessaire.
- Réponds en français, de façon concise et factuelle. Cite des chiffres précis.
- Tu peux faire des calculs simples (totaux, moyennes, classements) à partir des données.
- Reste neutre et professionnel. Ne donne pas de conseils disciplinaires individuels \
définitifs ; présente les faits.
- Format : phrases courtes ou listes à puces si pertinent. Pas de markdown lourd."""

SYNTHESIS_SYSTEM = """Tu es un analyste RH. À partir des données JSON de présence \
fournies, rédige une synthèse RH professionnelle en français.

Structure attendue :
1. Résumé exécutif (2-3 phrases).
2. Présence et ponctualité (chiffres clés, taux, retards).
3. Points d'attention (absentéisme, retards récurrents, discipline) — uniquement \
si les données les montrent.
4. Congés.
5. Recommandations concrètes (3 maximum), proportionnées et neutres.

Règles : n'utilise que les chiffres présents dans les données ; n'invente rien ; \
reste factuel et bienveillant ; pas de jugement individuel définitif. Texte clair, \
sans markdown lourd."""


def answer_question(user, question, date_from=None, date_to=None):
    """Assistant Q/R. Renvoie un dict {answer, context_period}."""
    data = ctx.build_analytics_context(user, date_from, date_to)
    message = (
        f"Question de l'utilisateur ({user.get_role_display()}) : {question}\n\n"
        f"Données analytiques (JSON) :\n{json.dumps(data, ensure_ascii=False, default=str)}"
    )
    answer = llm.complete(ASSISTANT_SYSTEM, message)
    return {
        'answer': answer,
        'period': data['periode'],
        'scope': data['perimetre'],
    }


def generate_hr_synthesis(user, date_from=None, date_to=None):
    """Synthèse RH. Utilise l'IA si configurée, sinon un template déterministe."""
    data = ctx.build_analytics_context(user, date_from, date_to)

    if llm.is_configured():
        message = (
            "Rédige la synthèse RH à partir de ces données.\n\n"
            f"Données (JSON) :\n{json.dumps(data, ensure_ascii=False, default=str)}"
        )
        text = llm.complete(SYNTHESIS_SYSTEM, message)
        source = 'ia'
    else:
        text = _fallback_synthesis(data)
        source = 'template'

    return {
        'synthesis': text,
        'source': source,
        'period': data['periode'],
        'scope': data['perimetre'],
        'metrics': data['periode_agregats'],
    }


def _fallback_synthesis(data):
    """Synthèse RH déterministe (sans IA), à partir du contexte agrégé."""
    a = data['periode_agregats']
    p = data['periode']
    lines = []
    lines.append(f"SYNTHÈSE RH — {data['entreprise']} ({data['perimetre']})")
    lines.append(f"Période : du {p['debut']} au {p['fin']}")
    lines.append("")
    lines.append("1. Résumé exécutif")
    lines.append(
        f"L'effectif suivi est de {data['effectif_total']} employé(s). "
        f"Le taux de présence sur la période est de {a['taux_presence_pct']}%, "
        f"pour {a['heures_travaillees_total']} heures travaillées au total."
    )
    lines.append("")
    lines.append("2. Présence et ponctualité")
    lines.append(
        f"- Jours de présence : {a['jours_presents']}"
        f"  | Jours en retard : {a['jours_retard']}"
        f"  | Jours d'absence : {a['jours_absents']}"
    )
    lines.append(f"- Minutes de retard cumulées : {a['minutes_retard_total']}")
    lines.append(f"- Heures supplémentaires : {a['heures_supplementaires_total']}")

    if data['top_retards']:
        lines.append("")
        lines.append("3. Points d'attention — retards récurrents")
        for r in data['top_retards']:
            nom = f"{r.get('user__first_name', '')} {r.get('user__last_name', '')}".strip()
            lines.append(f"- {nom} : {r['nb_retards']} retard(s), {r['minutes_total']} min cumulées")

    disc = data['discipline']
    if disc['total']:
        lines.append("")
        lines.append(f"Actions disciplinaires sur la période : {disc['total']}.")

    c = data['conges']
    lines.append("")
    lines.append("4. Congés")
    lines.append(
        f"- Demandes en attente : {c['en_attente']}"
        f"  | Congés approuvés sur la période : {c['approuves_sur_periode']}"
    )

    lines.append("")
    lines.append("5. Recommandations")
    if a['jours_absents'] > a['jours_presents'] * 0.1 and a['jours_presents']:
        lines.append("- Surveiller l'absentéisme : le niveau d'absence mérite un suivi.")
    if data['top_retards']:
        lines.append("- Échanger avec les employés concernés par des retards répétés.")
    if c['en_attente']:
        lines.append(f"- Traiter les {c['en_attente']} demande(s) de congé en attente.")
    if len(lines) and lines[-1] == "5. Recommandations":
        lines.append("- Situation globalement saine ; maintenir le suivi régulier.")

    lines.append("")
    lines.append("(Synthèse générée automatiquement à partir des données de pointage. "
                 "Activez l'IA pour une analyse rédigée plus fine.)")
    return "\n".join(lines)
