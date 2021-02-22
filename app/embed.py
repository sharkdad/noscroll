from itertools import chain
from typing import Iterable, Mapping, Optional

from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .data import Embed
from .utils import first

EMBED_TYPE_HTML = "html"
EMBED_TYPE_VIDEO = "video"
EMBED_TYPE_IMAGE = "image"


def get_embed(md: Mapping) -> Optional[Embed]:
    embed_funcs = (
        embed_reddit_video_fallback,
        embed_reddit_preview_video_variant,
        embed_reddit_video_preview_fallback,
        embed_reddit_media_embed,
        embed_gallery_image,
        embed_preview_image,
    )
    parents = md.get("crosspost_parent_list") or []
    embeds = ((f(m) for m in (md, *parents)) for f in embed_funcs)
    return first(chain.from_iterable(embeds))


def embed_reddit_video_fallback(md: Mapping) -> Optional[Embed]:
    build_embed = lambda rv: embed_video("fallback_url", rv)
    return first((build_embed(rv) for rv in get_reddit_videos(md) if rv))


def embed_reddit_preview_video_variant(md: Mapping) -> Optional[Embed]:
    def build_embed(img: Mapping) -> Optional[Embed]:
        variants = img.get("variants") or {}
        mp4 = variants.get("mp4") or {}
        src = mp4.get("source") or {}
        return embed_video("url", src)

    preview = md.get("preview") or {}
    images = preview.get("images") or []
    return first((build_embed(img) for img in images))


def embed_reddit_video_preview_fallback(md: Mapping) -> Optional[Embed]:
    preview = md.get("preview") or {}
    rvp = preview.get("reddit_video_preview") or {}
    return embed_video("fallback_url", rvp)


def embed_reddit_media_embed(md: Mapping) -> Optional[Embed]:
    html = """
        <div class="embed" style="padding-top: {}">
            {}
        </div>
    """

    def media_embed(embed: Mapping) -> Optional[Embed]:
        if not (content := embed.get("content")):
            return None

        w = embed.get("width", 1280)
        h = embed.get("height", 720)
        padding = f"{(100 * (h / w)):.2f}%"

        embed_html: str = format_html(html, padding, mark_safe(content))
        return Embed(EMBED_TYPE_HTML, None, embed_html, w, h)

    embeds = (md.get(e) for e in ("media_embed", "secure_media_embed"))
    return first((media_embed(e) for e in embeds if e))


def embed_gallery_image(md: Mapping) -> Optional[Embed]:
    media = md.get("media_metadata") or {}
    gallery = md.get("gallery_data") or {}
    items = gallery.get("items") or []
    media_ids = (item.get("media_id") for item in items if item)
    imgs = (media.get(media_id) for media_id in media_ids if media_id)
    srcs = (img.get("s") for img in imgs if img)
    img = first(srcs)
    return embed_image(img.get("u"), img.get("x"), img.get("y")) if img else None


def embed_preview_image(md: Mapping) -> Optional[Embed]:
    def build_embed(img: Mapping) -> Optional[Embed]:
        src = img.get("source") or {}
        url = src.get("url")
        return embed_image(url, src.get("width"), src.get("height")) if url else None

    preview = md.get("preview") or {}
    images = preview.get("images") or []
    return first((build_embed(img) for img in images))


# unused for now, maybe use for full screen
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


def embed_video(url_field: str, md: Mapping) -> Optional[Embed]:
    if not (url := md.get(url_field)):
        return None
    return Embed(EMBED_TYPE_VIDEO, url, None, md.get("width"), md.get("height"))


def embed_image(url: str, width: Optional[int], height: Optional[int]) -> Embed:
    return Embed(EMBED_TYPE_IMAGE, url, None, width, height)


def get_iframe_padding(md: Mapping) -> Optional[str]:
    height = md.get("height")
    width = md.get("width")
    return f"{(100 * height / width):.2f}" if height and width else None


def get_reddit_videos(md: Mapping) -> Iterable[Optional[Mapping]]:
    medias = (md.get(k) for k in ("media", "secure_media"))
    return (m.get("reddit_video") for m in medias if m)