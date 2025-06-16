# Create this file: apps/affiliates/migrations/0002_affiliate_form_assignments.py

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('forms', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('affiliates', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AffiliateFormAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True)),
                ('leads_generated', models.PositiveIntegerField(default=0)),
                ('conversions', models.PositiveIntegerField(default=0)),
                ('affiliate', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='affiliates.affiliate')),
                ('assigned_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='form_assignments_made', to=settings.AUTH_USER_MODEL)),
                ('form', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='forms.form')),
            ],
            options={
                'ordering': ['-assigned_at'],
            },
        ),
        migrations.AddField(
            model_name='affiliate',
            name='assigned_forms',
            field=models.ManyToManyField(blank=True, related_name='assigned_affiliates', through='affiliates.AffiliateFormAssignment', to='forms.form'),
        ),
        migrations.AlterUniqueTogether(
            name='affiliateformassignment',
            unique_together={('affiliate', 'form')},
        ),
    ]
