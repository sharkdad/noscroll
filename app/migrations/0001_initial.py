# Generated by Django 3.0.8 on 2020-07-30 22:22

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Link',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('hn_id', models.BigIntegerField(blank=True, null=True, unique=True)),
                ('title', models.TextField()),
                ('posted_at', models.DateTimeField()),
                ('score', models.BigIntegerField(default=0)),
                ('is_read', models.BooleanField(default=False)),
                ('is_saved', models.BooleanField(default=False)),
                ('metadata', django.contrib.postgres.fields.jsonb.JSONField(default=dict)),
            ],
        ),
    ]
