# Generated by Django 3.1.7 on 2021-04-14 23:31

from django.db import migrations, models
import django_cryptography.fields


def encrypt_tokens(apps, *_):
    Profile = apps.get_model("app", "Profile")
    for profile in Profile.objects.all():
        profile.enc_tokens = profile.tokens
        profile.save()


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0006_auto_20201005_1928"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="enc_tokens",
            field=django_cryptography.fields.encrypt(models.JSONField(default=dict)),
        ),
        migrations.RunPython(encrypt_tokens),
    ]
