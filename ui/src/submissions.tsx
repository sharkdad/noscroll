import React, { useState, useEffect, memo, useContext, useRef, UIEvent } from "react"
import { Link, useHistory, useLocation } from "react-router-dom"
import { AppContext } from "./app"
import { LoadId } from "./data"
import { ScrollHandler, SubmissionLoadingState } from "./scrolling"
import { callAsync, wrapAsync } from "./utils"

export interface LinkLoaderProps {
  load_id: LoadId
}

const PAGE_SIZE = 10

export function LinkLoader(props: LinkLoaderProps) {
  const { load_id } = props

  const [loading_state, set_loading_state] = useState<SubmissionLoadingState>({
    results: [],
    is_loading: false,
  })
  const [page_index, set_page_index] = useState(-1)
  const scroll = useRef(new ScrollHandler(load_id, set_page_index, set_loading_state))

  const items = loading_state.results.slice(0, (page_index + 1) * PAGE_SIZE)
  return (
    <>
      <Layout
        items={items}
        items_loaded={loading_state.results.length}
        scroll={scroll.current}
      />
    </>
  )
}

interface FullscreenInteractions {
  gallery_next: () => void
  gallery_prev: () => void
}

interface FullscreenProps {
  items: any[]
  window_state: WindowState
}

export function Fullscreen(props: FullscreenProps) {
  const { items, window_state } = props
  const location = useLocation()
  const history = useHistory()

  const [zoom, set_zoom] = useState(false)
  const [gallery_idx, set_gallery_idx] = useState(0)

  function reset_state(): void {
    set_zoom(false)
    set_gallery_idx(0)
  }

  function toggle_zoom(): void {
    set_zoom((z) => !z)
  }

  const modal_up = useRef(false)
  const cached_item = useRef(null)

  var item = null
  var location_is_valid = true
  if (location.state?.idx != null) {
    const idx: number = location.state.idx
    if (idx < 0 || idx >= items.length) {
      location_is_valid = false
    } else {
      item = items[idx]
    }
  }

  useEffect(() => {
    $("#fs-modal").on("hide.bs.modal", function (e) {
      if (modal_up.current) {
        modal_up.current = false
        history.goBack()
        reset_state()
      }
    })
  }, [history])

  useEffect(() => {
    if (!location_is_valid) {
      history.goBack()
      reset_state()
    }

    if (item == null && modal_up.current) {
      modal_up.current = false
      reset_state()
      $("#fs-modal").modal("hide")
    } else if (item != null && !modal_up.current) {
      modal_up.current = true
      $("#fs-modal").modal("show")
    }
  }, [item, location, history, location_is_valid])

  if (item != null) {
    cached_item.current = item
  }

  const is_gallery = cached_item.current?.embed?.embed_type === "gallery"
  var gallery_size = 0
  if (is_gallery) {
    gallery_size = cached_item.current.embed.gallery.length
  }

  const interactions: FullscreenInteractions = {
    gallery_next(): void {
      set_gallery_idx((curr_idx) => (curr_idx + 1) % gallery_size)
      set_zoom(false)
    },

    gallery_prev(): void {
      set_gallery_idx((curr_idx) => (curr_idx === 0 ? gallery_size - 1 : curr_idx - 1))
      set_zoom(false)
    },
  }

  var max_width = 0
  var max_height = 0
  if (cached_item.current != null) {
    const screen_width = window_state.inner_width - 20
    const screen_height = window_state.inner_height

    const min_width = Math.min(300, screen_width)
    const max_expanded_width = Math.min(min_width * 1.5, screen_width)

    var embed = null
    if (is_gallery) {
      embed = cached_item.current.embed.gallery[gallery_idx]
    } else if (cached_item.current.embed?.embed_type === "video") {
      embed = cached_item.current.embed.video
    } else {
      embed = cached_item.current.embed
    }

    const ar = embed && embed.width && embed.height ? embed.width / embed.height : 2 / 3

    const func = zoom ? Math.max : Math.min
    max_height = func(screen_width / ar, screen_height)
    max_width = Math.floor(max_height * ar)

    if (max_width < min_width) {
      max_width = max_expanded_width
      max_height = max_width / ar
    }
  }

  return (
    <div
      className="modal fade"
      id="fs-modal"
      tabIndex={-1}
      aria-labelledby="fs-modalLabel"
      aria-hidden="true"
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ width: `${max_width}px`, maxWidth: "none", margin: "none" }}
      >
        <div className="modal-content">
          <div className="modal-body">
            {item && (
              <SubmissionDisplay
                is_alt={false}
                is_only_item={false}
                is_cropped={false}
                submission={item}
                height={max_height}
                max_width={max_width}
                full_screen={interactions}
                toggle_zoom={toggle_zoom}
                gallery_idx={is_gallery ? gallery_idx : null}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface LayoutProps {
  items: any[]
  items_loaded: number
  scroll: ScrollHandler
}

interface WindowState {
  inner_width: number
  inner_height: number
}

interface MediaRow {
  row_items: any[]
  ars: number[]
  is_cropped: boolean[]
  sum_ars: number
  height: number
  sum_widths: number
  screen_width_minus_margins: number
}

function start_row(): MediaRow {
  return {
    row_items: [],
    ars: [],
    is_cropped: [],
    sum_ars: 0,
    height: 0,
    sum_widths: 0,
    screen_width_minus_margins: 0,
  }
}

function Layout(props: LayoutProps) {
  const { items, items_loaded, scroll } = props
  const { app_details, density } = useContext(AppContext)
  const { is_authenticated } = app_details

  const [window_state, set_window_state] = useState<WindowState>({
    inner_width: document.documentElement.clientWidth,
    inner_height: window.innerHeight,
  })

  const last_window_state = useRef<WindowState>({ ...window_state })

  scroll.expand_item_refs(items.length)
  const rows = []
  const screen_width = window_state.inner_width - 32
  const screen_height = Math.min(window_state.inner_height, 800 * density.factor) - 128
  const min_height = Math.min(400 * density.factor, screen_height)
  const min_width = Math.min(200, screen_width)
  const max_expanded_width = Math.min(min_width * 1.5, screen_width)
  const no_embed_lookahead = Math.ceil(PAGE_SIZE / 2)

  let ordered_items = []
  let items_offset = 0
  let no_embed_chunk_start_idx = 0
  let no_embed_chunk = []
  let row_start_idx = 0
  let curr_row = start_row()
  let item_idx = 0

  function push_items(row_items: any[]): void {
    items_offset += row_items.length
    ordered_items.push(...row_items)
  }

  function finish_no_embed_chunk(): void {
    rows.push(
      <div key={rows.length} className="container px-0">
        <SubmissionRow
          is_alt={rows.length % 2 === 0}
          no_embed_items={[...no_embed_chunk]}
          items_shown={items.length}
          items_loaded={items_loaded}
          items_offset={items_offset}
          scroll={scroll}
        />
      </div>
    )
    push_items(no_embed_chunk)
    no_embed_chunk = []
  }

  function add_to_row(item: any): MediaRow | null {
    const ar =
      item.embed && item.embed.width && item.embed.height
        ? item.embed.width / item.embed.height
        : 2 / 3
    const row_items = [...curr_row.row_items, item]
    const ars = [...curr_row.ars, ar]
    const is_cropped = [...curr_row.is_cropped, false]
    let sum_ars = curr_row.sum_ars + ar
    const num_margins = row_items.length - 1
    const screen_width_minus_margins = screen_width - num_margins * 16
    const width = (screen_width_minus_margins * ar) / sum_ars
    const height = Math.min(width / ar, screen_height)
    let sum_widths = ars.reduce((sum, ar) => sum + ar * height, 0)

    for (let index = 0; index < ars.length; index++) {
      const curr_width = ars[index] * height
      const min_expand_width = min_width - curr_width
      if (min_expand_width > 0) {
        const width_left = screen_width_minus_margins - sum_widths
        const expand_width = Math.min(width_left, max_expanded_width - curr_width)
        if (expand_width < min_expand_width) {
          return null
        }
        const new_width = curr_width + expand_width
        ars[index] = new_width / height
        is_cropped[index] = true
        sum_widths += expand_width
        sum_ars = ars.reduce((sum, ar) => sum + ar, 0)
      }
    }

    return {
      row_items,
      ars,
      sum_ars,
      is_cropped,
      height,
      sum_widths,
      screen_width_minus_margins,
    }
  }

  function finish_row(): void {
    if (
      no_embed_chunk.length > 0 &&
      no_embed_chunk_start_idx < item_idx - no_embed_lookahead
    ) {
      finish_no_embed_chunk()
    }

    rows.push(
      <SubmissionRow
        key={rows.length}
        is_alt={rows.length % 2 === 0}
        row={curr_row}
        items_shown={items.length}
        items_loaded={items_loaded}
        items_offset={items_offset}
        scroll={scroll}
      />
    )
    push_items(curr_row.row_items)
    curr_row = start_row()
  }

  var items_to_process = items.slice()
  while (items_to_process.length > 0) {
    const item = items_to_process.shift()

    if (item.embed == null) {
      if (no_embed_chunk.length === 0) {
        no_embed_chunk_start_idx = item_idx
      }
      no_embed_chunk.push(item)
    } else {
      const new_row = add_to_row(item)
      if (
        curr_row.row_items.length > 0 &&
        (new_row == null || new_row.height < min_height)
      ) {
        finish_row()
        curr_row = add_to_row(item)
      } else {
        curr_row = new_row
      }

      if (curr_row.row_items.length === 1) {
        row_start_idx = item_idx
      }

      if (curr_row.sum_widths > 0.95 * curr_row.screen_width_minus_margins) {
        finish_row()
      }
    }

    if (
      curr_row.row_items.length > 0 &&
      row_start_idx < item_idx - no_embed_lookahead
    ) {
      finish_row()
    }

    item_idx++
  }

  if (curr_row.row_items.length > 0) {
    finish_row()
  }
  if (no_embed_chunk.length > 0) {
    finish_no_embed_chunk()
  }

  useEffect(() => {
    callAsync(() => scroll.load_first_page())
  }, [scroll])

  useEffect(() => {
    const timer = setInterval(
      wrapAsync(() => scroll.mark_as_read(is_authenticated)),
      5000
    )
    return () => clearInterval(timer)
  }, [scroll, is_authenticated])

  useEffect(() => {
    const timer = setInterval(() => {
      if (
        !document.fullscreenElement &&
        window.innerHeight !== last_window_state.current.inner_height &&
        document.documentElement.clientWidth !== last_window_state.current.inner_width
      ) {
        console.log(
          `Screen dimensions changed: ${window.innerHeight} ${document.documentElement.clientWidth} ${window.devicePixelRatio}`
        )
        set_window_state({
          inner_height: window.innerHeight,
          inner_width: document.documentElement.clientWidth,
        })
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (
      window_state.inner_height !== last_window_state.current.inner_height ||
      window_state.inner_width !== last_window_state.current.inner_width
    ) {
      scroll.scroll_to_last_seen()
      last_window_state.current.inner_height = window_state.inner_height
      last_window_state.current.inner_width = window_state.inner_width
    } else {
      scroll.observe_new_items()
    }
  })

  return (
    <>
      {rows}
      <Fullscreen items={ordered_items} window_state={window_state} />
    </>
  )
}

interface SubmissionRowProps {
  row?: MediaRow
  no_embed_items?: any[]
  is_alt: boolean
  items_shown: number
  items_loaded: number
  items_offset: number
  scroll: ScrollHandler
}

const SubmissionRow = memo((props: SubmissionRowProps) => {
  const {
    row,
    no_embed_items,
    is_alt,
    items_shown,
    items_loaded,
    items_offset,
    scroll,
  } = props

  let row_items: any[] = []
  let widths: number[] = []
  if (row != null) {
    row_items = row.row_items
    widths = row.ars.map((ar) => row.height * ar)
  } else {
    row_items = no_embed_items
  }

  return (
    <div className={`grid-row px-2`}>
      {row_items.map((item, index) => (
        <div
          key={item.id}
          data-reddit-id={item.id}
          data-show-next-page={items_offset + index === Math.max(0, items_shown - 5)}
          data-load-more={
            items_offset + index === Math.max(0, items_loaded - PAGE_SIZE * 2)
          }
          ref={scroll.get_item_ref(items_offset + index)}
          className="mx-2 my-2"
          style={{
            width: row != null ? `${widths[index]}px` : undefined,
          }}
        >
          <SubmissionDisplay
            is_only_item={row_items.length === 1}
            is_alt={is_alt}
            is_cropped={row?.is_cropped[index] ?? false}
            submission={item}
            height={row?.height}
            max_width={widths[index]}
            idx={items_offset + index}
          />
        </div>
      ))}
    </div>
  )
})

interface SubmissionInteractions {
  on_touch_end: (event: UIEvent) => void
  on_click: (event: UIEvent) => void
  on_click_zoom: (event: UIEvent) => void
}

interface SubmissionDisplayProps {
  is_alt: boolean
  is_only_item: boolean
  is_cropped: boolean
  submission: any
  height?: number
  max_width?: number
  idx?: number
  full_screen?: FullscreenInteractions
  toggle_zoom?: () => void
  gallery_idx?: number
}

const SubmissionDisplay = memo((props: SubmissionDisplayProps) => {
  const {
    is_only_item,
    is_cropped,
    submission,
    height,
    max_width,
    idx,
    full_screen,
    toggle_zoom,
    gallery_idx,
  } = props
  const embed_type = submission.embed?.embed_type
  const history = useHistory()
  const { is_light_mode } = useContext(AppContext)

  const [show_hover, set_show_hover] = useState(false)

  const last_mouse_ts = useRef<number | null>(null)
  const is_touched = useRef(false)

  function set_idle_timeout(initial_ts: number, delay: number = 5000): void {
    setTimeout(() => {
      if (last_mouse_ts.current == null) {
        return
      }

      const ts_diff = last_mouse_ts.current - initial_ts

      if (ts_diff < 100) {
        last_mouse_ts.current = null
        set_show_hover(false)
      } else {
        set_idle_timeout(
          last_mouse_ts.current,
          5000 - (performance.now() - last_mouse_ts.current)
        )
      }
    }, delay)
  }

  function do_show_hover(e: UIEvent): void {
    if (last_mouse_ts.current == null) {
      set_show_hover(true)
      set_idle_timeout(e.timeStamp)
    }

    last_mouse_ts.current = e.timeStamp
  }

  function stop_hover(e: UIEvent): void {
    last_mouse_ts.current = null
    set_show_hover(false)
  }

  function on_mouse_move(e: UIEvent): void {
    if (is_touched.current) {
      return
    }

    do_show_hover(e)
  }

  function on_mouse_out(e: UIEvent): void {
    if (is_touched.current) {
      return
    }

    stop_hover(e)
  }

  const interactions: SubmissionInteractions = {
    on_touch_end(event: UIEvent): void {
      is_touched.current = true
    },

    on_click(event: UIEvent): void {
      const tagName =
        event.target instanceof Element ? event.target.tagName.toLowerCase() : ""
      if (tagName !== "div" && tagName !== "img") {
        return
      }

      if (show_hover) {
        stop_hover(event)
      } else {
        do_show_hover(event)
      }
    },

    on_click_zoom(event: UIEvent): void {
      if (full_screen) {
        toggle_zoom()
      } else {
        history.push({ ...history.location, state: { idx } })
      }
    },
  }

  const bg_class = is_light_mode ? "bg-light" : "bg-dark"

  const shared_header = (
    <>
      {full_screen && (
        <button type="button" className="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      )}
      <div className="header-details">
        {submission.posted_at} -{" "}
        <a
          className=""
          rel="noopener noreferrer"
          target="_blank"
          href={`https://reddit.com${submission.permalink}`}
        >
          {submission.num_comments} comments
        </a>{" "}
        - <Link to={`/r/${submission.subreddit}`}>{submission.subreddit}</Link>
      </div>
      <a
        className="header-link"
        rel="noopener noreferrer"
        target="_blank"
        href={submission.url}
      >
        {submission.title}
      </a>
    </>
  )

  return (
    <>
      <div
        onMouseMove={on_mouse_move}
        onMouseLeave={on_mouse_out}
        onTouchEnd={interactions.on_touch_end}
        onClick={interactions.on_click}
        className={`text-center w-100 mx-auto sub-container${
          show_hover ? " show" : ""
        }`}
        style={{ maxWidth: `${max_width}px` }}
      >
        {!full_screen && (
          <div
            className={`${bg_class} header${
              submission.embed && !is_only_item ? " header-with-embed" : ""
            }`}
            style={{ maxWidth: `${max_width}px` }}
          >
            {shared_header}
          </div>
        )}
        {submission.embed && (
          <>
            {!is_only_item && !full_screen && (
              <>
                <div
                  className={`${bg_class} header header-with-embed-placeholder`}
                  style={{ maxWidth: `${max_width}px` }}
                >
                  {shared_header}
                </div>
                <div className="header invisible header-invisible-placeholder">
                  <div className="header-details">placeholder</div>
                  <span className="header-link">placeholder</span>
                </div>
              </>
            )}

            {embed_type === "html" && (
              <HtmlEmbed
                embed={submission.embed}
                title={submission.title}
                height={height}
                full_screen={full_screen}
                is_cropped={false}
              />
            )}
            {(embed_type === "image" ||
              embed_type === "gallery" ||
              embed_type === "video") && (
              <ImageEmbed
                embed={
                  gallery_idx == null
                    ? submission.embed
                    : submission.embed.gallery[gallery_idx]
                }
                title={submission.title}
                height={height}
                interactions={interactions}
                full_screen={full_screen}
                is_cropped={is_cropped}
              />
            )}
          </>
        )}
      </div>
    </>
  )
})

interface Embed {
  embed_type: string
  url?: string
  html?: string
  width?: number
  height?: number
  video?: Embed
  over_18?: boolean
}

interface EmbedProps {
  embed: Embed
  title: string
  height: number
  interactions?: SubmissionInteractions
  full_screen?: FullscreenInteractions
  is_cropped: boolean
}

const HtmlEmbed = memo((props: EmbedProps) => {
  const { embed, height } = props
  const { html } = embed
  const pt = get_ratio_padding_top(embed)

  return (
    <div
      className="embed-container"
      style={{ width: `${get_embed_ar(embed) * height}px` }}
    >
      <div
        className="embed"
        style={{ paddingTop: pt }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
})

const VideoEmbed = memo((props: EmbedProps) => {
  const { embed, height } = props

  return (
    <div
      className="embed-container"
      style={{ width: `${get_embed_ar(embed) * height}px` }}
    >
      <video
        controls
        playsInline
        muted
        autoPlay
        style={{ width: "100%", height: "auto" }}
      >
        <source src={embed.url} type="video/mp4" />
      </video>
    </div>
  )
})

const ImageEmbed = memo((props: EmbedProps) => {
  const { embed, height, interactions, full_screen, is_cropped } = props
  const { url } = embed

  const { show_nsfw } = useContext(AppContext)

  const is_nsfw = !show_nsfw && !full_screen && (embed.over_18 ?? false)

  const [show_video, set_show_video] = useState(false)
  const [blur_nsfw, set_blur_nsfw] = useState(true)

  const always_show_controls =
    !full_screen &&
    (embed.embed_type !== "image" || is_cropped || (is_nsfw && blur_nsfw))

  return (
    <div style={{ position: "relative", height: `${height}px`, overflow: "hidden" }}>
      <div className={`px-1 controls${always_show_controls ? " always-show" : ""}`}>
        {is_nsfw && !show_video && (
          <button
            onClick={() => set_blur_nsfw((old) => !old)}
            className="btn btn-link mx-1"
          >
            <i className={`bi bi-eye${blur_nsfw ? "" : "-slash"}`}></i>
          </button>
        )}
        {embed.embed_type === "image" && (
          <>
            {is_cropped && (
              <button
                onClick={interactions.on_click_zoom}
                className="btn btn-link mx-1"
              >
                <i className="bi bi-arrows-expand"></i>
              </button>
            )}
            {!is_cropped && (
              <button
                onClick={interactions.on_click_zoom}
                className="btn btn-link mx-1"
              >
                <i className="bi bi-zoom-in"></i>
              </button>
            )}
            {full_screen && (
              <button
                className="btn btn-link mx-1"
                data-dismiss="modal"
                aria-label="Close"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </>
        )}
        {!full_screen && embed.embed_type === "gallery" && (
          <button onClick={interactions.on_click_zoom} className="btn btn-link mx-1">
            <i className="bi bi-images"></i>
          </button>
        )}

        {full_screen && embed.embed_type === "gallery" && (
          <>
            <button onClick={full_screen.gallery_prev} className="btn btn-link mx-1">
              <i className="bi bi-arrow-left"></i>
            </button>
            <button onClick={interactions.on_click_zoom} className="btn btn-link mx-1">
              <i className="bi bi-zoom-in"></i>
            </button>
            <button
              className="btn btn-link mx-1"
              data-dismiss="modal"
              aria-label="Close"
            >
              <i className="bi bi-x"></i>
            </button>
            <button onClick={full_screen.gallery_next} className="btn btn-link mx-1">
              <i className="bi bi-arrow-right"></i>
            </button>
          </>
        )}

        {!show_video && embed.embed_type === "video" && (
          <button onClick={() => set_show_video(true)} className="btn btn-link mx-1">
            <i className="bi bi-play-btn"></i>
          </button>
        )}
      </div>

      <div>
        {show_video && (
          <VideoEmbed
            embed={embed.video}
            title={props.title}
            height={height}
            full_screen={full_screen}
            is_cropped={false}
          />
        )}
        {!show_video && url && (
          <img
            alt={props.title}
            src={url}
            referrerPolicy="no-referrer"
            className={`preview${is_nsfw && blur_nsfw ? " blur" : ""}`}
          />
        )}
      </div>
    </div>
  )
})

function get_ratio_padding_top(embed?: Embed): string {
  const percent = 100 / get_embed_ar(embed)
  return `${percent.toFixed(2)}%`
}

function get_embed_ar(embed?: Embed): number {
  const width = embed?.width ?? 16
  const height = embed?.height ?? 9
  return width / height
}
