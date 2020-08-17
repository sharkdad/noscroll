from django.contrib.admin import ModelAdmin, register
from django.utils.html import format_html

from .models import Link, RelativeScoring

@register(Link)
class LinkAdmin(ModelAdmin):
    list_display = ('linked_title', 'is_saved', 'posted_at', 'score', 'relative_score', 'is_read')
    list_filter = ('is_read', 'is_saved', 'feeds')
    list_editable = ('is_read', 'is_saved')
    list_per_page = 10
    search_fields = ('id', 'hn_id', 'title')
    actions_on_top = False
    actions_on_bottom = False

    def linked_title(self, link: Link):
        text = "[%s] %s" % (link.metadata['subreddit'], link.title) if link.reddit_id else link.title
        img = ""
        if link.reddit_id is not None:
            url = link.metadata['url']
            if 'i.redd.it' in url or 'i.imgur.com' in url:
                img = format_html('<div><img style="max-width:100%;max-height:100vh" referrerpolicy="no-referrer" src="{}"/></div>', url)
            elif 'gfycat' in url:
                gfycat_id = url[url.rfind("/")+1:]
                img = format_html('<div style="position:relative; padding-bottom:calc(100.00% + 44px)"><iframe src="https://gfycat.com/ifr/{}" frameborder="0" scrolling="no" width="100%" height="100%" style="position:absolute;top:0;left:0;" allowfullscreen></iframe></div>', gfycat_id)
        return format_html('<a href="{}" target="_blank">{}</a>{}', link.get_absolute_url(), text, img)

@register(RelativeScoring)
class RelativeScoringAdmin(ModelAdmin):
    list_display = ('id', 'score', 'last_updated')
    search_fields = ('id',)