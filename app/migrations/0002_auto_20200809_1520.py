# Generated by Django 3.0.8 on 2020-08-09 22:20

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Feed",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, primary_key=True, serialize=False
                    ),
                ),
                (
                    "feed_type",
                    models.IntegerField(
                        choices=[(1, "Reddit Front Page"), (2, "Reddit Multi")]
                    ),
                ),
                (
                    "metadata",
                    django.contrib.postgres.fields.jsonb.JSONField(default=dict),
                ),
            ],
        ),
        migrations.AddField(
            model_name="link",
            name="reddit_id",
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AlterField(
            model_name="link",
            name="metadata",
            field=django.contrib.postgres.fields.jsonb.JSONField(
                blank=True, default=dict
            ),
        ),
        migrations.AddField(
            model_name="link",
            name="feeds",
            field=models.ManyToManyField(to="app.Feed"),
        ),
    ]
