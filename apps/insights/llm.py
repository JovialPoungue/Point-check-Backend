"""
Client LLM minimal et sans dépendance (urllib stdlib).

Supporte deux familles de fournisseurs, configurées via variables d'env :
  - AI_PROVIDER=anthropic  -> API Messages d'Anthropic (défaut)
  - AI_PROVIDER=openai     -> tout endpoint compatible OpenAI (/chat/completions)

Variables : AI_API_KEY, AI_MODEL, AI_BASE_URL (override), AI_MAX_TOKENS, AI_TIMEOUT_SECONDS.

Si aucune clé n'est configurée, is_configured() renvoie False et l'appelant
bascule sur un mode dégradé (voir services.py).
"""
import json
import logging
import urllib.request
import urllib.error
from django.conf import settings

logger = logging.getLogger('apps.insights')


class LLMError(Exception):
    """Erreur d'appel au fournisseur IA (réseau, auth, quota...)."""


def is_configured():
    return bool(getattr(settings, 'AI_API_KEY', ''))


def _post_json(url, headers, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=settings.AI_TIMEOUT_SECONDS) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='ignore')
        logger.error("Erreur HTTP %s du fournisseur IA: %s", e.code, body[:500])
        raise LLMError(f"Le service IA a renvoyé une erreur ({e.code}).")
    except urllib.error.URLError as e:
        logger.error("Échec réseau vers le fournisseur IA: %s", e)
        raise LLMError("Impossible de contacter le service IA.")


def complete(system_prompt, user_message):
    """
    Envoie une requête au LLM et renvoie le texte de la réponse.
    Lève LLMError en cas de problème.
    """
    if not is_configured():
        raise LLMError("Aucune clé IA configurée (AI_API_KEY).")

    provider = settings.AI_PROVIDER
    model = settings.AI_MODEL
    max_tokens = settings.AI_MAX_TOKENS

    if provider == 'anthropic':
        base = settings.AI_BASE_URL or 'https://api.anthropic.com'
        url = f"{base.rstrip('/')}/v1/messages"
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': settings.AI_API_KEY,
            'anthropic-version': '2023-06-01',
        }
        payload = {
            'model': model,
            'max_tokens': max_tokens,
            'system': system_prompt,
            'messages': [{'role': 'user', 'content': user_message}],
        }
        data = _post_json(url, headers, payload)
        try:
            parts = [b.get('text', '') for b in data.get('content', []) if b.get('type') == 'text']
            return '\n'.join(p for p in parts if p).strip()
        except Exception:
            raise LLMError("Réponse IA inattendue.")

    # Compatible OpenAI (OpenAI, OpenRouter, Groq, Mistral, endpoints locaux...)
    base = settings.AI_BASE_URL or 'https://api.openai.com/v1'
    url = f"{base.rstrip('/')}/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {settings.AI_API_KEY}",
    }
    payload = {
        'model': model,
        'max_tokens': max_tokens,
        'messages': [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': user_message},
        ],
    }
    data = _post_json(url, headers, payload)
    try:
        return data['choices'][0]['message']['content'].strip()
    except (KeyError, IndexError):
        raise LLMError("Réponse IA inattendue.")
