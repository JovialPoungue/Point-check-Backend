from django.urls import path
from .views import ai_query, hr_synthesis, ai_status

urlpatterns = [
    path('query/', ai_query, name='ai_query'),
    path('hr-synthesis/', hr_synthesis, name='hr_synthesis'),
    path('status/', ai_status, name='ai_status'),
]
