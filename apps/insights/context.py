"""
Construction d'un instantané analytique factuel de l'entreprise.

Ce contexte est ensuite fourni à l'IA. Il est entièrement calculé côté serveur
à partir de la base, et respecte le cloisonnement par rôle :
  - admin   : toute l'entreprise ;
  - manager : uniquement son département ;
  - employé : pas d'accès (les vues bloquent en amont).

Aucune donnée d'une autre entreprise ne peut fuiter : tout est filtré sur
company = user.company.
"""
from datetime import timedelta, date
from django.db.models import Count, Avg, Sum
from django.utils import timezone

from apps.accounts.models import User, Department
from apps.attendance.models import (
    AttendanceRecord, DailyAttendance, LeaveRequest, DisciplinaryAction
)

# Statuts considérés comme "présence"
PRESENT_STATUSES = ['present', 'late', 'half_day']
MAX_EMPLOYEES_DETAIL = 60  # borne le volume envoyé à l'IA


def _scoped_employees(user):
    """Employés visibles selon le rôle de l'utilisateur."""
    qs = User.objects.filter(company=user.company, is_active_employee=True)
    if user.role == 'manager' and user.department_id:
        qs = qs.filter(department=user.department)
    return qs.select_related('department')


def resolve_period(date_from=None, date_to=None):
    """Période par défaut : le mois en cours."""
    today = timezone.now().date()
    if not date_to:
        date_to = today
    if not date_from:
        date_from = today.replace(day=1)
    return date_from, date_to


def build_analytics_context(user, date_from=None, date_to=None):
    """Retourne un dictionnaire factuel et compact pour l'IA."""
    company = user.company
    date_from, date_to = resolve_period(date_from, date_to)
    today = timezone.now().date()

    employees = _scoped_employees(user)
    employee_ids = list(employees.values_list('id', flat=True))
    total_employees = len(employee_ids)

    daily = DailyAttendance.objects.filter(
        company=company, user_id__in=employee_ids,
        date__gte=date_from, date__lte=date_to,
    )

    # --- Instantané du jour ---
    today_daily = daily.filter(date=today)
    today_present = today_daily.filter(status__in=PRESENT_STATUSES).count()
    today_late = today_daily.filter(status='late').count()
    with_record_today = set(today_daily.values_list('user_id', flat=True))
    today_absent = sum(1 for eid in employee_ids if eid not in with_record_today)

    # --- Agrégats de période ---
    present_days = daily.filter(status__in=PRESENT_STATUSES).count()
    late_days = daily.filter(status='late').count()
    absent_days = daily.filter(status='absent').count()
    total_hours = daily.aggregate(s=Sum('total_hours'))['s'] or 0
    total_late_minutes = daily.aggregate(s=Sum('minutes_late'))['s'] or 0
    overtime_hours = daily.aggregate(s=Sum('overtime_hours'))['s'] or 0

    counted_days = present_days + absent_days
    attendance_rate = round(present_days / counted_days * 100, 1) if counted_days else 0

    # --- Détail par employé ---
    employees_detail = []
    for emp in employees[:MAX_EMPLOYEES_DETAIL]:
        emp_daily = daily.filter(user=emp)
        e_present = emp_daily.filter(status__in=PRESENT_STATUSES).count()
        e_late = emp_daily.filter(status='late').count()
        e_absent = emp_daily.filter(status='absent').count()
        e_hours = emp_daily.aggregate(s=Sum('total_hours'))['s'] or 0
        e_late_min = emp_daily.aggregate(s=Sum('minutes_late'))['s'] or 0
        employees_detail.append({
            'nom': emp.full_name,
            'matricule': emp.employee_id or '',
            'departement': emp.department.name if emp.department else 'Non assigné',
            'jours_presents': e_present,
            'jours_retard': e_late,
            'jours_absents': e_absent,
            'minutes_retard_total': int(e_late_min),
            'heures_travaillees': round(e_hours, 1),
        })

    # --- Départements ---
    departments = []
    dept_qs = Department.objects.filter(company=company)
    if user.role == 'manager' and user.department_id:
        dept_qs = dept_qs.filter(id=user.department_id)
    for d in dept_qs:
        departments.append({
            'nom': d.name,
            'effectif': d.employees.filter(is_active_employee=True).count(),
        })

    # --- Congés ---
    leaves = LeaveRequest.objects.filter(company=company, user_id__in=employee_ids)
    leaves_period = leaves.filter(start_date__lte=date_to, end_date__gte=date_from)
    leaves_summary = {
        'en_attente': leaves.filter(status='pending').count(),
        'approuves_sur_periode': leaves_period.filter(status='approved').count(),
        'par_type': list(
            leaves_period.values('leave_type').annotate(n=Count('id')).order_by('-n')
        ),
    }

    # --- Discipline ---
    disc = DisciplinaryAction.objects.filter(
        company=company, user_id__in=employee_ids,
        created_at__date__gte=date_from, created_at__date__lte=date_to,
    )
    disciplinary_summary = {
        'total': disc.count(),
        'par_severite': list(disc.values('severity').annotate(n=Count('id'))),
        'par_type': list(disc.values('action_type').annotate(n=Count('id'))),
    }

    # --- Top retards ---
    top_late = list(
        AttendanceRecord.objects.filter(
            company=company, user_id__in=employee_ids,
            check_type='check_in', minutes_late__gt=0,
            timestamp__date__gte=date_from, timestamp__date__lte=date_to,
        ).values('user__first_name', 'user__last_name').annotate(
            nb_retards=Count('id'), minutes_total=Sum('minutes_late')
        ).order_by('-nb_retards')[:5]
    )

    # --- Tendance 7 jours ---
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_daily = daily.filter(date=d)
        trend.append({
            'date': d.isoformat(),
            'presents': day_daily.filter(status__in=PRESENT_STATUSES).count(),
            'retards': day_daily.filter(status='late').count(),
            'absents': day_daily.filter(status='absent').count(),
        })

    return {
        'entreprise': company.name,
        'genere_le': timezone.now().isoformat(),
        'perimetre': (
            f"Département {user.department.name}"
            if user.role == 'manager' and user.department else "Toute l'entreprise"
        ),
        'periode': {'debut': date_from.isoformat(), 'fin': date_to.isoformat()},
        'effectif_total': total_employees,
        'aujourdhui': {
            'presents': today_present,
            'retards': today_late,
            'absents': today_absent,
        },
        'periode_agregats': {
            'taux_presence_pct': attendance_rate,
            'jours_presents': present_days,
            'jours_retard': late_days,
            'jours_absents': absent_days,
            'heures_travaillees_total': round(total_hours, 1),
            'minutes_retard_total': int(total_late_minutes),
            'heures_supplementaires_total': round(overtime_hours, 1),
        },
        'departements': departments,
        'conges': leaves_summary,
        'discipline': disciplinary_summary,
        'top_retards': top_late,
        'tendance_7_jours': trend,
        'employes': employees_detail,
        'note_volume': (
            f"{total_employees} employés ; {len(employees_detail)} détaillés."
        ),
    }
