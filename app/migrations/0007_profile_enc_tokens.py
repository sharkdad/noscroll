# Generated by Django 3.1.7 on 2021-04-14 23:31

from app.allauth import hash_username
from django.db import migrations, models
import django_cryptography.fields


def encrypt_tokens(apps, *_):
    Profile = apps.get_model("app", "Profile")
    for profile in Profile.objects.all():
        if profile.enc_tokens == "{}":
            user = profile.user
            account = user.socialaccount_set.all()[0]
            uid_hash = hash_username(account.uid)

            user.first_name = ""
            if user.username == account.uid:
                user.username = uid_hash
            user.save()

            account.uid = uid_hash
            account.extra_data = {}
            account.save()

            profile.enc_tokens = profile.tokens
            profile.save()


def reverse_encrypt_tokens(*_):
    pass


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
        migrations.RunPython(encrypt_tokens, reverse_encrypt_tokens),
    ]
