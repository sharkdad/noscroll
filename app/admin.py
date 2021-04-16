from django.contrib.admin import ModelAdmin, register
from django.utils.html import format_html

from .models import Feed, Link, Profile, RelativeScoring, SeenSubmission


def linked_title(l: Link):
    text = "[%s] %s" % (l.metadata["subreddit"], l.title) if l.reddit_id else l.title
    html = '<a href="{}" target="_blank">{}</a>'
    return format_html(html, l.get_absolute_url(), text)


def link_embed(l: Link):
    html = '</td></tr><tr><td style="text-align: center" colspan=7><div>{}</div>{}'
    return format_html(html, linked_title(l), l.embed or "")


@register(Link)
class LinkAdmin(ModelAdmin):
    list_display = (
        "id",
        "is_saved",
        "posted_at",
        "score",
        "is_read",
        link_embed,
    )
    list_filter = ("is_read", "is_saved", "feeds")
    list_editable = ("is_read", "is_saved")
    list_per_page = 10
    search_fields = ("id", "hn_id", "reddit_id", "title")
    actions_on_top = False
    actions_on_bottom = False


@register(RelativeScoring)
class RelativeScoringAdmin(ModelAdmin):
    list_display = ("id", "score", "last_updated")
    search_fields = ("id",)


@register(SeenSubmission)
class SeenSubmissionAdmin(ModelAdmin):
    list_display = ("id", "user", "submission_id")
    search_fields = ("user", "submission_id")


@register(Feed)
class FeedAdmin(ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("id", "metadata")


@register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ("user", "tokens", "enc_tokens")