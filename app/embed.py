from itertools import chain
from typing import Iterable, Mapping, Optional
from urllib.parse import urlparse

from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .utils import first, get_ext


def get_embed(md: Mapping) -> Optional[str]:
    embed_funcs = (
        embed_reddit_video_fallback,
        embed_reddit_preview_video_variant,
        embed_reddit_video_preview_fallback,
        embed_reddit_media_embed,
        embed_gallery_image,
        embed_direct_image_link,
        embed_imgur_card,
    )
    parents = md.get("crosspost_parent_list") or []
    embeds = ((f(m) for m in (md, *parents)) for f in embed_funcs)
    return first(chain.from_iterable(embeds))


def embed_reddit_video_fallback(md: Mapping) -> Optional[str]:
    urls = (rv.get("fallback_url") for rv in get_reddit_videos(md) if rv)
    return first((embed_video(url) for url in urls if url))


def embed_reddit_preview_video_variant(md: Mapping) -> Optional[str]:
    def get_img(img: Mapping) -> Optional[str]:
        variants = img.get("variants") or {}
        mp4 = variants.get("mp4") or {}
        source = mp4.get("source") or {}
        url = source.get("url")
        return embed_video(url) if url else None

    preview = md.get("preview") or {}
    images = preview.get("images") or []
    return first((get_img(img) for img in images))


def embed_reddit_video_preview_fallback(md: Mapping) -> Optional[str]:
    preview = md.get("preview") or {}
    rvp = preview.get("reddit_video_preview") or {}
    fallback_url = rvp.get("fallback_url")
    return embed_video(fallback_url) if fallback_url else None


def embed_video(url: str) -> str:
    html = """
        <div>
            <video controls style="max-width: 100%; max-height: 80vh">
                <source src='{}' type='video/mp4'>
            </video>
        </div>
    """
    return format_html(html, url)


def embed_direct_image_link(md: Mapping) -> Optional[str]:
    url = md.get("url")
    if not url:
        return None
    img_exts = set(["jpg", "jpeg", "png", "gif", "tif", "tiff", "bmp"])
    return embed_image(url) if get_ext(urlparse(url).path) in img_exts else None


def embed_gallery_image(md: Mapping) -> Optional[str]:
    media = md.get("media_metadata") or {}
    gallery = md.get("gallery_data") or {}
    items = gallery.get("items") or []
    media_ids = (item.get("media_id") for item in items if item)
    imgs = (media.get(media_id) for media_id in media_ids if media_id)
    srcs = (img.get("s") for img in imgs if img)
    urls = (src.get("u") for src in srcs if src)
    return first((embed_image(url) for url in urls if url))


def embed_image(url: str) -> str:
    html = """
        <img src="{}" referrerpolicy="no-referrer" class="preview" />
    """
    return format_html(html, url)


def embed_reddit_media_embed(md: Mapping) -> Optional[str]:
    html = """
        <div class="embed" style="padding-top: {}%">
            {}
        </div>
    """

    def media_embed(embed: Mapping) -> Optional[str]:
        if not (content := embed.get("content")):
            return None
        return format_html(html, get_iframe_padding(embed), mark_safe(content))

    embeds = (md.get(e) for e in ("media_embed", "secure_media_embed"))
    return first((media_embed(e) for e in embeds if e))


def embed_reddit_video_iframe(md: Mapping) -> Optional[str]:
    html = """
        <div class="embed" style="padding-top: {}%">
            <iframe class="responsive" allowfullscreen scrolling="no" gesture="media" allow="encrypted-media"
                src="https://old.reddit.com/mediaembed/{}">
            </iframe>
        </div>
    """
    paddings = (get_iframe_padding(v) for v in get_reddit_videos(md) if v)
    return first((format_html(html, p, md.get("id")) for p in paddings if p))


def get_iframe_padding(md: Mapping) -> Optional[str]:
    # TODO: fix this shit
    return "0"
    # height = md.get("height")
    # width = md.get("width")
    # return f"{(100 * height / width):.2f}" if height and width else None


def get_reddit_videos(md: Mapping) -> Iterable[Optional[Mapping]]:
    medias = (md.get(k) for k in ("media", "secure_media"))
    return (m.get("reddit_video") for m in medias if m)


def embed_imgur_card(md: Mapping) -> Optional[str]:
    if not (permalink := md.get("permalink")):
        return None
    if not (link := md.get("url")):
        return None
    if not "imgur.com" in link.lower():
        return None

    html = """
        <blockquote class="reddit-card">
            <a href="https://old.reddit.com{}?ref=share&ref_source=embed"></a>
        </blockquote>
    """
    return format_html(html, permalink)