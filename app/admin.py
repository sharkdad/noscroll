from django.contrib.admin import ModelAdmin, register
from django.utils.html import format_html

from .embed import get_embed
from .models import Link, RelativeScoring


def linked_title(l: Link):
    text = "[%s] %s" % (l.metadata["subreddit"], l.title) if l.reddit_id else l.title
    html = '<a href="{}" target="_blank">{}</a>'
    return format_html(html, l.get_absolute_url(), text)


def link_embed(l: Link):
    html = '</td></tr><tr><td style="text-align: center" colspan=7>{}'
    return format_html(html, l.embed or "")


@register(Link)
class LinkAdmin(ModelAdmin):
    list_display = (
        linked_title,
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
