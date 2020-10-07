# Generated by Django 3.1.1 on 2020-10-06 02:28

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('app', '0005_profile'),
    ]

    operations = [
        migrations.CreateModel(
            name='SeenSubmission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('submission_id', models.CharField(max_length=6)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddConstraint(
            model_name='seensubmission',
            constraint=models.UniqueConstraint(fields=('user', 'submission_id'), name='unique_seen'),
        ),
    ]
