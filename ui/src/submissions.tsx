import React, { useState, useEffect, memo, useContext, useRef } from "react"
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
    <Layout
      items={items}
      items_loaded={loading_state.results.length}
      scroll={scroll.current}
    />
  )
}

interface LayoutProps {
  items: any[]
  items_loaded: number
  scroll: ScrollHandler
}

function Layout(props: LayoutProps) {
  const { items, items_loaded, scroll } = props
  const { is_authenticated } = useContext(AppContext).app_details

  scroll.expand_item_refs(items.length)

  const screen_width = 0.9 * window.innerWidth
  const screen_height = 0.8 * window.innerHeight
  const min_height = 0.5 * screen_height
  const max_width = 0.8 * screen_width
  const rows = []
  let items_offset = 0
  let row_items = []
  let ars = []
  let sum_ars = 0
  let height = 0
  items.forEach((submission) => {
    const ar =
      submission.embed && submission.embed.width && submission.embed.height
        ? submission.embed.width / submission.embed.height
        : 1
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
    scroll.observe_new_items()
  })

  useEffect(() => {
    const timer = setInterval(
      wrapAsync(() => scroll.mark_as_read(is_authenticated)),
      5000
    )
    return () => clearInterval(timer)
  }, [scroll, is_authenticated])

  return <>{rows}</>
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
    <div className="grid-row mb-5">
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
          <SubmissionDisplay submission={item} max_width={widths[index]} />
        </div>
      ))}
    </div>
  )
})

interface SubmissionDisplayProps {
  submission: any
  max_width: number
}

const SubmissionDisplay = memo((props: SubmissionDisplayProps) => {
  const { submission, max_width } = props
  const embed_type = submission.embed?.embed_type
  return (
    <>
      <div className={`mx-2 text-center${submission.embed ? " text-truncate" : ""}`}>
        <b>
          <a rel="noopener noreferrer" target="_blank" href={submission.url}>
            {submission.title}
          </a>
        </b>
        <p>
          <small>
            {submission.subreddit} -{" "}
            <a
              rel="noopener noreferrer"
              target="_blank"
              href={`https://reddit.com${submission.permalink}`}
            >
              {submission.num_comments} comments
            </a>{" "}
            - {submission.posted_at} - {submission.score}
          </small>
        </p>
      </div>
      {submission.embed && (
        <div
          className="text-center w-100 mx-auto"
          style={{ maxWidth: `${max_width}px` }}
        >
          {embed_type === "html" && (
            <HtmlEmbed embed={submission.embed} title={submission.title} />
          )}
          {embed_type === "video" && (
            <VideoEmbed embed={submission.embed} title={submission.title} />
          )}
          {embed_type === "image" && (
            <ImageEmbed embed={submission.embed} title={submission.title} />
          )}
        </div>
      )}
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
  const { url } = props.embed

  return (
    <img alt={props.title} src={url} referrerPolicy="no-referrer" className="preview" />
  )
})

function get_ratio_padding_top(embed: Embed): string {
  const width = embed.width ?? 16
  const height = embed.height ?? 9
  const percent = 100 * (height / width)
  return `${percent.toFixed(2)}%`
}
