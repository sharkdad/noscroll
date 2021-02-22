import React, { useState, useEffect, memo, useContext, useRef } from "react"
import { AppContext } from "./app"
import { LoadId, SubmissionLoadingState } from "./data"
import { ScrollHandler } from "./scrolling"
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
  return <Layout items={items} items_loaded={loading_state.results.length} scroll={scroll.current} />
}

interface LayoutProps {
  items: any[]
  items_loaded: number
  scroll: ScrollHandler
}

function Layout(props: LayoutProps) {
  const { items, items_loaded, scroll } = props
  const is_authenticated = useContext(AppContext).state.details.is_authenticated

  scroll.expand_item_refs(items.length)

  const screen_width = .9 * window.innerWidth
  const screen_height = .8 * window.innerHeight
  const min_height = .5 * screen_height
  const max_width = .8 * screen_width
  const rows = []
  let items_offset = 0
  let row_items = []
  let ars = []
  let sum_ars = 0
  let height = 0
  items.forEach(submission => {
    const ar = submission.embed && submission.embed.width && submission.embed.height
      ? submission.embed.width / submission.embed.height
      : 1
    const new_sum_ars = sum_ars + ar
    const width = screen_width * ar / new_sum_ars
    const new_height = Math.min(width / ar, screen_height)
    const sum_widths = ars.reduce((sum, ar) => sum + (ar * height), 0)
    if (new_height < min_height || sum_widths > max_width) {
      rows.push(<SubmissionRow key={rows.length} items={row_items} ars={ars}
        height={height} items_shown={items.length} items_loaded={items_loaded}
        items_offset={items_offset} scroll={scroll} />)
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
    rows.push(<SubmissionRow key={rows.length} items={row_items} ars={ars}
      height={height} items_shown={items.length} items_loaded={items_loaded}
      items_offset={items_offset} scroll={scroll} />)
  }

  useEffect(() => {
    callAsync(() => scroll.load_first_page())
  }, [scroll])

  useEffect(() => {
    scroll.observe_new_items()
  })

  useEffect(() => {
    const timer = setInterval(wrapAsync(() => scroll.mark_as_read(is_authenticated)), 5000);
    return () => clearInterval(timer);
  }, [scroll, is_authenticated])

  return (
    <>
      {rows}
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
  const widths = ars.map(ar => height * ar)
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
          data-load-more={items_offset + index === Math.max(0, items_loaded - (PAGE_SIZE * 2))}
          ref={scroll.get_item_ref(items_offset + index)}
          style={{ width: `${100 * (widths[index] + spacing_per) / screen_width}%` }}
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

const SubmissionDisplay = memo<SubmissionDisplayProps>(({ submission, max_width }) => (
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
      <div className="text-center w-100 mx-auto" style={{ maxWidth: `${max_width}px`}}
        dangerouslySetInnerHTML={{ __html: submission.embed.html }}
      />
    )}
  </>
))
