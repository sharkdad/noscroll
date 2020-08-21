from django.contrib.admin import ModelAdmin, register
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from os.path import splitext
from typing import Any, Iterable, Mapping, Optional
from urllib.parse import urlparse

from .models import Link, RelativeScoring
from .utils import first_not_none

@register(Link)
class LinkAdmin(ModelAdmin):
    list_display = ('linked_title', 'is_saved', 'posted_at', 'score', 'is_read')
    list_filter = ('is_read', 'is_saved', 'feeds')
    list_editable = ('is_read', 'is_saved')
    list_per_page = 10
    search_fields = ('id', 'hn_id', 'title')
    actions_on_top = False
    actions_on_bottom = False

    def linked_title(self, link: Link):
        text = "[%s] %s" % (link.metadata['subreddit'], link.title) if link.reddit_id else link.title
        embed = get_embed(link) or ""
        return format_html('<a href="{}" target="_blank">{}</a>{}', link.get_absolute_url(), text, embed)

def get_embed(link: Link) -> Optional[str]:
    parents = link.metadata.get('crosspost_parent_list') or []
    embeds = (
        embed_reddit_video_fallback,
        embed_reddit_preview_video_variant,
        embed_reddit_video_preview_fallback,
        embed_reddit_media_embed,
        embed_gallery_image,
        embed_direct_image_link,
    )
    for embed_func in embeds:
        embed = first_not_none((embed_func(md) for md in (link.metadata, *parents)))
        if embed:
            return embed

def embed_reddit_video_fallback(md: Mapping) -> Optional[str]:
    rv = get_reddit_video(md) or {}
    fallback_url = rv.get('fallback_url')
    return embed_video(fallback_url) if fallback_url else None

def embed_reddit_preview_video_variant(md: Mapping) -> Optional[str]:
    preview = md.get('preview') or {}
    images = preview.get('images') or []
    for img in images:
        variants = img.get('variants') or {}
        mp4 = variants.get('mp4') or {}
        source = mp4.get('source') or {}
        url = source.get('url')
        if url:
            return embed_video(url)

def embed_reddit_video_preview_fallback(md: Mapping) -> Optional[str]:
    preview = md.get('preview') or {}
    rvp = preview.get('reddit_video_preview') or {}
    fallback_url = rvp.get('fallback_url')
    return embed_video(fallback_url) if fallback_url else None

def embed_video(url: str) -> str:
    return format_html("""
        <div>
            <video controls style="max-width: 100%; max-height: 80vh">
                <source src='{}' type='video/mp4'>
            </video>
        </div>
    """, url)

def embed_direct_image_link(md: Mapping) -> Optional[str]:
    url = md.get('url')
    if url:
        parsed_url = urlparse(url)
        ext = splitext(parsed_url.path)[1]
        is_image = ext.lower()[1:] in set(['jpg', 'jpeg', 'png', 'gif', 'tif', 'tiff', 'bmp'])
        return embed_image(url) if is_image else None

def embed_gallery_image(md: Mapping) -> Optional[str]:
    gallery = md.get('gallery_data') or {}
    items = gallery.get('items') or []
    first = next(iter(items), None) or {}
    media_id = first.get('media_id') or ''
    media = md.get('media_metadata') or {}
    img = media.get(media_id) or {}
    src = img.get('s') or {}
    url = src.get('u')
    return embed_image(url) if url else None

def embed_image(url: str) -> str:
    return format_html("""
        <div>
            <img src="{}" referrerpolicy="no-referrer" style="max-width: 100%; max-height: 80vh" />
        </div>
    """, url)

def embed_reddit_media_embed(md: Mapping) -> Optional[str]:
    for embed in filter(None, (md.get(e) for e in ('media_embed', 'secure_media_embed'))):
        if not (content := embed.get('content')):
            continue
        return format_html('<div style="position: relative; overflow: hidden; padding-top: {}%">{}</div>',
            get_iframe_padding(embed), mark_safe(content))

def embed_reddit_video_iframe(md: Mapping) -> Optional[str]:
    id = md.get('id')
    rv = get_reddit_video(md)
    if rv:
        return format_html("""
            <div style="position: relative; overflow: hidden; padding-top: {}%">
                <iframe allowfullscreen scrolling="no" gesture="media" allow="encrypted-media"
                    src="https://old.reddit.com/mediaembed/{}">
                </iframe>
            </div>
        """, get_iframe_padding(rv), id)

def get_iframe_padding(md: Mapping) -> str:
    height = md.get('height')
    width = md.get('width')
    return f'{100 * height / width if height and width else 56.25:.2f}'

def get_reddit_video(md: Mapping) -> Optional[Mapping]:
    return first_not_none(((md.get(k) or {}).get('reddit_video') for k in ('media', 'secure_media')))

@register(RelativeScoring)
class RelativeScoringAdmin(ModelAdmin):
    list_display = ('id', 'score', 'last_updated')
    search_fields = ('id',)