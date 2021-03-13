import React, { useState, useEffect, memo, useContext, useRef, MouseEvent } from "react"
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

  function gallery_next(): void {
    set_gallery_idx((curr_idx) => (curr_idx + 1) % gallery_size)
  }

  function gallery_prev(): void {
    set_gallery_idx((curr_idx) => (curr_idx === 0 ? gallery_size - 1 : curr_idx - 1))
  }

  var max_width = 0
  if (cached_item.current != null) {
    const screen_width = window_state.inner_width - 20
    const screen_height = window_state.inner_height - 60

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
    const max_height = func(screen_width / ar, screen_height)
    max_width = max_height * ar
  }

  return (
    <div
      className="modal fade"
      id="fs-modal"
      tabIndex={-1}
      aria-labelledby="fs-modalLabel"
      aria-hidden="true"
    >
      {is_gallery && (
        <>
          <button className="btn btn-link control prev" onClick={gallery_prev}>
            <i className="bi bi-arrow-left-short"></i>
          </button>
          <button className="btn btn-link control next" onClick={gallery_next}>
            <i className="bi bi-arrow-right-short"></i>
          </button>
        </>
      )}
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ width: `${max_width}px`, maxWidth: "none", margin: "none" }}
      >
        <div className="modal-content">
          <div className="modal-body">
            {item && (
              <SubmissionDisplay
                submission={item}
                max_width={max_width}
                full_screen={true}
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

function Layout(props: LayoutProps) {
  const { items, items_loaded, scroll } = props
  const { is_authenticated } = useContext(AppContext).app_details

  const [window_state, set_window_state] = useState<WindowState>({
    inner_width: window.innerWidth,
    inner_height: window.innerHeight,
  })

  const last_window_state = useRef<WindowState>({ ...window_state })

  scroll.expand_item_refs(items.length)
  const rows = []
  const screen_width = 0.9 * window_state.inner_width
  const screen_height = 0.8 * window_state.inner_height
  const min_height = 0.5 * screen_height
  const max_width = 0.8 * screen_width

  let items_offset = 0
  let row_items = []
  let ars = []
  let sum_ars = 0
  let height = 0
  items.forEach((submission) => {
    const ar =
      submission.embed && submission.embed.width && submission.embed.height
        ? submission.embed.width / submission.embed.height
        : 2 / 3
    const new_sum_ars = sum_ars + ar
    const width = (screen_width * ar) / new_sum_ars
    const new_height = Math.min(width / ar, screen_height)
    const sum_widths = ars.reduce((sum, ar) => sum + ar * height, 0)
    if (new_height < min_height || sum_widths > max_width) {
      rows.push(
        <SubmissionRow
          key={rows.length}
          items={row_items}
          ars={ars}
          height={height}
          items_shown={items.length}
          items_loaded={items_loaded}
          items_offset={items_offset}
          scroll={scroll}
        />
      )
      items_offset += row_items.length
      row_items = [submission]
      ars = [ar]
      sum_ars = ar
      height = Math.min(screen_width / ar, screen_height)
    } else {
      row_items.push(submission)
      ars.push(ar)
      sum_ars = new_sum_ars
      height = new_height
    }
  })
  if (row_items.length > 0) {
    rows.push(
      <SubmissionRow
        key={rows.length}
        items={row_items}
        ars={ars}
        height={height}
        items_shown={items.length}
        items_loaded={items_loaded}
        items_offset={items_offset}
        scroll={scroll}
      />
    )
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
        window.innerHeight !== last_window_state.current.inner_height &&
        window.innerWidth !== last_window_state.current.inner_width
      ) {
        set_window_state({
          inner_height: window.innerHeight,
          inner_width: window.innerWidth,
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
      <Fullscreen items={items} window_state={window_state} />
    </>
  )
}

interface SubmissionRowProps {
  items: any[]
  ars: number[]
  height: number
  items_shown: number
  items_loaded: number
  items_offset: number
  scroll: ScrollHandler
}

const SubmissionRow = memo((props: SubmissionRowProps) => {
  const { items, ars, height, items_shown, items_loaded, items_offset, scroll } = props
  const screen_width = window.innerWidth
  const widths = ars.map((ar) => height * ar)
  const total_width = widths.reduce((sum, width) => sum + width, 0)
  const spacing_width = screen_width - total_width
  const spacing_per = spacing_width / items.length
  return (
    <div className="grid-row mb-4">
      {items.map((item, index) => (
        <div
          key={item.id}
          data-reddit-id={item.id}
          data-show-next-page={items_offset + index === Math.max(0, items_shown - 5)}
          data-load-more={
            items_offset + index === Math.max(0, items_loaded - PAGE_SIZE * 2)
          }
          ref={scroll.get_item_ref(items_offset + index)}
          style={{
            width: `${(100 * (widths[index] + spacing_per)) / screen_width}%`,
          }}
        >
          <SubmissionDisplay
            submission={item}
            max_width={widths[index]}
            idx={items_offset + index}
          />
        </div>
      ))}
    </div>
  )
})

interface SubmissionDisplayProps {
  submission: any
  max_width?: number
  idx?: number
  full_screen?: boolean
  toggle_zoom?: () => void
  gallery_idx?: number
}

const SubmissionDisplay = memo((props: SubmissionDisplayProps) => {
  const { submission, max_width, idx, full_screen, toggle_zoom, gallery_idx } = props
  const embed_type = submission.embed?.embed_type
  const history = useHistory()
  const { is_light_mode } = useContext(AppContext)

  const [show_hover, set_show_hover] = useState(false)

  const last_mouse_ts = useRef<number | null>(null)

  function set_idle_timeout(initial_ts: number, delay: number = 2000): void {
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
          2000 - (performance.now() - last_mouse_ts.current)
        )
      }
    }, delay)
  }

  function on_mouse_move(e: MouseEvent): void {
    if (last_mouse_ts.current == null) {
      set_show_hover(true)
      set_idle_timeout(e.timeStamp)
    }

    last_mouse_ts.current = e.timeStamp
  }

  function on_mouse_out(e: MouseEvent): void {
    last_mouse_ts.current = null
    set_show_hover(false)
  }

  function on_click(): void {
    if (full_screen) {
      toggle_zoom()
    } else {
      history.push({ ...history.location, state: { idx } })
    }
  }

  const bg_class = is_light_mode ? "bg-light" : "bg-dark"

  return (
    <>
      <div
        onMouseMove={on_mouse_move}
        onMouseLeave={on_mouse_out}
        className={`text-center w-100 mx-auto sub-container${
          show_hover ? " show" : ""
        }`}
        style={{ maxWidth: `${max_width}px` }}
      >
        <div
          className={`${bg_class} header${
            submission.embed ? " header-with-embed" : ""
          }`}
          style={{ maxWidth: `${max_width}px` }}
        >
          {submission.embed && <div className="linkblocker" />}
          {full_screen && (
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          )}
          <a
            className="header-link"
            rel="noopener noreferrer"
            target="_blank"
            href={submission.url}
          >
            {submission.title}
          </a>
          <div className="header-details">
            {submission.subreddit} -{" "}
            <a
              className=""
              rel="noopener noreferrer"
              target="_blank"
              href={`https://reddit.com${submission.permalink}`}
            >
              {submission.num_comments} comments
            </a>{" "}
            - {submission.posted_at} - {submission.score} -{" "}
            {idx != null && (
              <Link to={(loc) => ({ ...loc, state: { idx } })}>fullscreen</Link>
            )}
          </div>
        </div>
        {submission.embed && (
          <>
            <div
              className={`${bg_class} header header-with-embed-placeholder`}
              style={{ maxWidth: `${max_width}px` }}
            >
              {full_screen && (
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              )}
              <a
                className="header-link"
                rel="noopener noreferrer"
                target="_blank"
                href={"google.com"}
              >
                {submission.title}
              </a>
            </div>
            <div className="header invisible header-invisible-placeholder">
              <span className="header-link">placeholder</span>
            </div>
            <div className="embed-container">
              {embed_type === "html" && (
                <HtmlEmbed embed={submission.embed} title={submission.title} />
              )}
              {embed_type === "video" && full_screen && (
                <VideoEmbed embed={submission.embed.video} title={submission.title} />
              )}
              {embed_type === "video" && !full_screen && (
                <ImageEmbed
                  embed={submission.embed}
                  title={submission.title}
                  on_click={on_click}
                />
              )}
              {(embed_type === "image" || embed_type === "gallery") && (
                <ImageEmbed
                  embed={
                    gallery_idx == null
                      ? submission.embed
                      : submission.embed.gallery[gallery_idx]
                  }
                  title={submission.title}
                  on_click={on_click}
                />
              )}
            </div>
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
}

interface EmbedProps {
  embed: Embed
  title: string
  on_click?: () => void
}

const HtmlEmbed = memo((props: EmbedProps) => {
  const { embed } = props
  const { html } = embed
  const pt = get_ratio_padding_top(embed)

  return (
    <div
      className="embed"
      style={{ paddingTop: pt }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})

const VideoEmbed = memo((props: EmbedProps) => {
  const { url } = props.embed

  return (
    <div>
      <video controls style={{ width: "100%", height: "auto" }}>
        <source src={url} type="video/mp4" />
      </video>
    </div>
  )
})

const ImageEmbed = memo((props: EmbedProps) => {
  const { embed, on_click } = props
  const { url } = embed

  return (
    <>
      {embed.embed_type === "gallery" && (
        <button onClick={on_click} className="btn btn-link control embed-type">
          <i className="bi bi-images"></i>
        </button>
      )}

      {embed.embed_type === "video" && (
        <button onClick={on_click} className="btn btn-link control embed-type">
          <i className="bi bi-play-btn"></i>
        </button>
      )}

      <div style={{ minHeight: "12rem" }}>
        {url && (
          <img
            alt={props.title}
            src={url}
            referrerPolicy="no-referrer"
            className="preview"
            onClick={on_click}
          />
        )}
      </div>
    </>
  )
})

function get_ratio_padding_top(embed: Embed): string {
  const width = embed.width ?? 16
  const height = embed.height ?? 9
  const percent = 100 * (height / width)
  return `${percent.toFixed(2)}%`
}
