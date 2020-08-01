from django.contrib.admin import ModelAdmin, register
from django.utils.html import format_html

from .models import Link

@register(Link)
class LinkAdmin(ModelAdmin):
    list_display = ('linked_title', 'is_saved', 'posted_at', 'score', 'is_read')
    list_filter = ('is_read', 'is_saved')
    list_editable = ('is_read', 'is_saved')
    list_per_page = 10
    search_fields = ('id', 'hn_id', 'title')
    actions_on_top = False
    actions_on_bottom = False

    def linked_title(self, link: Link):
        return format_html('<a href="{}" target="_blank">{}</a>', link.get_absolute_url(), link.title)