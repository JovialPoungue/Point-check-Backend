"""
Clôture des journées de présence.

Pour chaque entreprise et chaque employé actif, crée/complète la ligne
DailyAttendance du jour traité :
  - marque ABSENT les employés sans aucun pointage (hors weekend / congé approuvé) ;
  - marque WEEKEND les samedis/dimanches ;
  - marque ON_LEAVE les employés en congé approuvé ce jour-là.

À planifier chaque nuit (cron, Vercel Cron, Celery beat...) :
    python manage.py close_daily_attendance            # hier
    python manage.py close_daily_attendance --date 2026-06-19
    python manage.py close_daily_attendance --days 7   # les 7 derniers jours
"""
from datetime import timedelta, datetime
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Company, User
from apps.attendance.models import DailyAttendance, LeaveRequest


class Command(BaseCommand):
    help = "Clôture les journées de présence et marque les absences."

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help="Date à traiter (YYYY-MM-DD).")
        parser.add_argument('--days', type=int, default=1,
                            help="Nombre de jours à remonter à partir de la date (défaut : 1).")

    def handle(self, *args, **options):
        if options.get('date'):
            base_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            base_date = timezone.now().date() - timedelta(days=1)  # hier par défaut

        days = max(1, options.get('days') or 1)
        total_created, total_absent = 0, 0

        for offset in range(days):
            day = base_date - timedelta(days=offset)
            created, absent = self._process_day(day)
            total_created += created
            total_absent += absent
            self.stdout.write(
                f"{day}: {created} ligne(s) créée(s), {absent} absence(s) marquée(s)."
            )

        self.stdout.write(self.style.SUCCESS(
            f"Terminé. {total_created} ligne(s), {total_absent} absence(s)."
        ))

    def _process_day(self, day):
        is_weekend = day.weekday() >= 5  # 5 = samedi, 6 = dimanche
        created_count, absent_count = 0, 0

        for company in Company.objects.filter(is_active=True):
            employees = User.objects.filter(
                company=company, is_active_employee=True, role='employee'
            )
            for emp in employees:
                daily, created = DailyAttendance.objects.get_or_create(
                    user=emp, date=day, defaults={'company': company}
                )

                # Si la journée a déjà des pointages, on n'écrase pas le statut calculé.
                if daily.check_in_time:
                    continue

                if is_weekend:
                    daily.status = DailyAttendance.DayStatus.WEEKEND
                elif self._on_approved_leave(emp, day):
                    daily.status = DailyAttendance.DayStatus.ON_LEAVE
                else:
                    daily.status = DailyAttendance.DayStatus.ABSENT
                    absent_count += 1

                daily.save()
                if created:
                    created_count += 1

        return created_count, absent_count

    @staticmethod
    def _on_approved_leave(employee, day):
        return LeaveRequest.objects.filter(
            user=employee,
            status=LeaveRequest.LeaveStatus.APPROVED,
            start_date__lte=day,
            end_date__gte=day,
        ).exists()
