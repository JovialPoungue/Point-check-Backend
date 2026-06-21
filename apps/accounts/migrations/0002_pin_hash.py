from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='pin_code',
            field=models.CharField(blank=True, help_text='Hash du code PIN', max_length=128),
        ),
    ]
