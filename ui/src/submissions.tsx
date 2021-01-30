import React, { useState, useEffect, memo, useContext, RefObject, useRef, createRef } from "react"
import { useParams, useLocation } from "react-router-dom"
import { AppContext, SortBy, TimeFilter } from "./app"
import { ScrollHandler } from "./scrolling"
import { wrapAsync, put, get } from "./utils"

export function LinkLoader() {
  const pageSize = 10

  const { state } = useContext(AppContext)
  const { reddit_user, sort_method, time_filter } = state

  const { subreddit, multiOwner, multiName } = useParams()
  const { search } = useLocation()

  const feedId =
    state.details.multis.find(m => m.owner === multiOwner && m.name === multiName)?.feed_id

  const [nextLoad, setNextLoad] = useState<LoadState>({})
  const [results, setResults] = useState<ResultsState>({
    submissions: [],
    page_index: 0
  })

  function loadMore() {
    setResults(lastResults => {
      const newPageIndex = lastResults.page_index + 1
  
      const nextPageIndex = newPageIndex + 1
      if ((nextPageIndex + 1) * pageSize > lastResults.submissions.length) {
        const lastSubmission = lastResults.submissions[lastResults.submissions.length - 1]
        if (lastSubmission == null) {
          return
        }
        setNextLoad((nl) => ({ ...nl, after: lastSubmission.id, next: lastResults.next }))
      }

      return {...lastResults, page_index: newPageIndex }
    })
  }

  const layout = useRef<LayoutState>({ item_divs: [], next_observe_idx: 0 })
  const scroll = useRef(new ScrollHandler(() => loadMore()))

  useEffect(() => {
    const timer = setInterval(wrapAsync(async () => {
      const ids = Array.from(scroll.current.read_ids)
      if (ids.length > 0) {
        if (state.reddit_user) {
          await put("/svc/api/submissions/mark_seen/", { ids })
        }
        ids.forEach(id => scroll.current.read_ids.delete(id))
      }
    }), 5000);
    return () => clearInterval(timer);
  }, [scroll, state.reddit_user])

  useEffect(
    wrapAsync(async () => {
      setResults({ submissions: [], page_index: 0 })
      layout.current = { item_divs: [], next_observe_idx: 0 }
      setNextLoad({
        id: {
          reddit_user,
          subreddit,
          multiOwner,
          multiName,
          feedId,
          sort_method,
          time_filter,
          search,
        },
      })
    }),
    [reddit_user, subreddit, multiOwner, multiName, feedId, sort_method, time_filter, search]
  )

  useEffect(
    wrapAsync(async () => {
      const loadId = nextLoad.id
      if (loadId == null) {
        return
      }

      var url = ""
      if (nextLoad.next != null) {
        url = nextLoad.next
      } else if (loadId.sort_method.name === "curated") {
        const searchParams = new URLSearchParams()
        searchParams.set("min_score", "500")
        searchParams.set("feeds", loadId.feedId)

        if (loadId.search) {
          new URLSearchParams(loadId.search).forEach(
            (value, key) => searchParams.set(key, value))
        }
        
        url = `/svc/api/links/?${searchParams}`
      } else {
        const searchParams = new URLSearchParams()
        searchParams.set("user", loadId.reddit_user)
        searchParams.set("sort", loadId.sort_method.name)
        if (loadId.sort_method.has_time_filter) {
          searchParams.set("time", loadId.time_filter.name)
        }

        if (loadId.subreddit != null) {
          searchParams.set("subreddit", loadId.subreddit)
        }

        if (loadId.multiOwner != null && loadId.multiName != null) {
          searchParams.set("multi_owner", loadId.multiOwner)
          searchParams.set("multi_name", loadId.multiName)
        }

        if (nextLoad.after != null) {
          searchParams.set("after", nextLoad.after)
        }

        if (loadId.search) {
          new URLSearchParams(loadId.search).forEach(
            (value, key) => searchParams.set(key, value))
        }
        
        url = `/svc/api/submissions/?${searchParams}`
      }

      const response = await get(url)
      const result = await response.json()
      setResults((lastResults) => ({
        ...lastResults,
        submissions: [...lastResults.submissions, ...result.results],
        next: result.next,
      }))
    }),
    [nextLoad]
  )

  const items = results.submissions.slice(0, (results.page_index + 1) * pageSize)
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
        height={height} items_offset={items_offset} layout={layout.current} />)
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
      height={height} items_offset={items_offset} layout={layout.current} />)
  }

  const new_item_count = items.length - layout.current.item_divs.length
  if (new_item_count > 0) {
    const new_refs =
      Array.from({ length: new_item_count }, () => createRef<HTMLDivElement>())
    layout.current.item_divs = [...layout.current.item_divs, ...new_refs]
  }

  useEffect(() => {
    const new_divs = layout.current.item_divs.slice(layout.current.next_observe_idx)
    new_divs.forEach(ref => scroll.current.observe(ref.current))
    layout.current.next_observe_idx = layout.current.item_divs.length
  }, [layout.current.item_divs])

  return (
    <>
      {rows}
      {results.submissions.length > 0 && (
        <div className="d-flex flex-column align-items-center">
          <button
            type="button"
            className="btn btn-primary mb-5"
            onClick={loadMore}
          >
            Load more
          </button>
        </div>
      )}
    </>
  )
}

interface LoadId {
  reddit_user: string
  subreddit?: string
  multiOwner?: string
  multiName?: string
  feedId?: string
  sort_method: SortBy
  time_filter: TimeFilter
  search: string
}

interface LoadState {
  id?: LoadId
  after?: string
  next?: string
}

interface ResultsState {
  submissions: any[]
  next?: string
  page_index: number
}

interface LayoutState {
  item_divs: RefObject<HTMLDivElement>[]
  next_observe_idx: number
}

interface SubmissionRowProps {
  items: any[]
  ars: number[]
  height: number
  items_offset: number
  layout: LayoutState
}

const SubmissionRow = memo((props: SubmissionRowProps) => {
  const { items, ars, height, items_offset, layout } = props
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
          data-load-more={items_offset + index === Math.max(0, layout.item_divs.length - 5)}
          ref={layout.item_divs[items_offset + index]}
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
