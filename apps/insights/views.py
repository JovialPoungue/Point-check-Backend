"""Endpoints IA : assistant analytique et synthèse RH."""
import logging
from datetime import datetime

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from . import services
from .llm import LLMError, is_configured

logger = logging.getLogger('apps.insights')


def _parse_date(value):
    if not value:
        return None
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _deny_employee(user):
    """Les fonctionnalités IA sont réservées aux admins et managers."""
    return user.role == 'employee'


class AIThrottle(ScopedRateThrottle):
    scope = 'ai'


class SynthesisThrottle(ScopedRateThrottle):
    scope = 'hr_synthesis'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([AIThrottle])
def ai_query(request):
    """Assistant analytique en langage naturel."""
    if not request.user.company:
        return Response({'detail': 'Aucune entreprise associée'}, status=400)
    if _deny_employee(request.user):
        return Response({'detail': 'Réservé aux administrateurs et managers.'}, status=403)

    question = (request.data.get('question') or '').strip()
    if not question:
        return Response({'detail': 'Question vide.'}, status=400)
    if len(question) > 500:
        return Response({'detail': 'Question trop longue (max 500 caractères).'}, status=400)

    if not is_configured():
        return Response({
            'detail': "L'assistant IA n'est pas configuré. Renseignez AI_API_KEY côté serveur.",
            'code': 'AI_NOT_CONFIGURED',
        }, status=503)

    date_from = _parse_date(request.data.get('date_from'))
    date_to = _parse_date(request.data.get('date_to'))

    try:
        result = services.answer_question(request.user, question, date_from, date_to)
    except LLMError as e:
        return Response({'detail': str(e), 'code': 'AI_ERROR'}, status=502)
    except Exception:
        logger.exception("Erreur inattendue de l'assistant IA")
        return Response({'detail': "Erreur interne de l'assistant."}, status=500)

    return Response(result)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([SynthesisThrottle])
def hr_synthesis(request):
    """Génère une synthèse RH (IA si configurée, sinon template déterministe)."""
    if not request.user.company:
        return Response({'detail': 'Aucune entreprise associée'}, status=400)
    if _deny_employee(request.user):
        return Response({'detail': 'Réservé aux administrateurs et managers.'}, status=403)

    src = request.data if request.method == 'POST' else request.query_params
    date_from = _parse_date(src.get('date_from'))
    date_to = _parse_date(src.get('date_to'))

    try:
        result = services.generate_hr_synthesis(request.user, date_from, date_to)
    except LLMError as e:
        return Response({'detail': str(e), 'code': 'AI_ERROR'}, status=502)
    except Exception:
        logger.exception("Erreur inattendue de la synthèse RH")
        return Response({'detail': 'Erreur interne lors de la génération.'}, status=500)

    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_status(request):
    """Indique au frontend si l'IA est configurée."""
    return Response({'ai_configured': is_configured()})
