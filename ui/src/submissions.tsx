import React, { useState, useEffect, memo, useContext } from "react"
import { useParams, useLocation } from "react-router-dom"
import { AppContext, SortBy, TimeFilter } from "./app"
import { wrapAsync, put, get } from "./utils"

export function LinkLoader() {
  const pageSize = 10

  const { state } = useContext(AppContext)
  const { reddit_user, sort_method, time_filter } = state

  const { subreddit, multiOwner, multiName } = useParams()
  const { search } = useLocation()

  const [nextLoad, setNextLoad] = useState<LoadState>({})
  const [results, setResults] = useState<ResultsState>({ submissions: [] })
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(
    wrapAsync(async () => {
      setResults({ submissions: [] })
      setPageIndex(0)
      setNextLoad({
        id: {
          reddit_user,
          subreddit,
          multiOwner,
          multiName,
          sort_method,
          time_filter,
          search,
        },
      })
    }),
    [reddit_user, subreddit, multiOwner, multiName, sort_method, time_filter, search]
  )

  useEffect(
    wrapAsync(async () => {
      const loadId = nextLoad.id
      if (loadId == null) {
        return
      }

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

      const response = await get(`/svc/api/submissions/?${searchParams}`)
      const result = await response.json()
      setResults((lastResults) => ({
        submissions: [...lastResults.submissions, ...result.results],
      }))
    }),
    [nextLoad]
  )

  function loadMore() {
    markAsRead()
    const newPageIndex = pageIndex + 1
    setPageIndex(newPageIndex)

    const nextPageIndex = newPageIndex + 1
    if ((nextPageIndex + 1) * pageSize > results.submissions.length) {
      const lastSubmission = results.submissions[results.submissions.length - 1]
      if (lastSubmission == null) {
        return
      }
      setNextLoad((nl) => ({ ...nl, after: lastSubmission.id }))
    }
  }

  const markAsRead = wrapAsync(async () => {
    const start = pageIndex * pageSize
    const end = (pageIndex + 1) * pageSize
    const ids = results.submissions.slice(start, end).map((s) => s.id)
    await put("/svc/api/submissions/mark_seen/", { ids })
  })

  const items = results.submissions.slice(0, (pageIndex + 1) * pageSize)
  const screen_width = .9 * window.innerWidth
  const screen_height = .8 * window.innerHeight
  const min_height = .5 * screen_height
  const max_width = .8 * screen_width
  const rows = []
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
      rows.push(<SubmissionRow items={row_items} ars={ars} height={height} />)
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
    rows.push(<SubmissionRow items={row_items} ars={ars} height={height} />)
  }


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
  sort_method: SortBy
  time_filter: TimeFilter
  search: string
}

interface LoadState {
  id?: LoadId
  after?: string
}

interface ResultsState {
  submissions: any[]
}

interface SubmissionRowProps {
  items: any[]
  ars: number[]
  height: number
}

const SubmissionRow = memo<SubmissionRowProps>(({ items, ars, height }) => {
  const screen_width = window.innerWidth
  const widths = ars.map(ar => height * ar)
  const total_width = widths.reduce((sum, width) => sum + width, 0)
  const spacing_width = screen_width - total_width
  const spacing_per = spacing_width / items.length
  return (
    <div className="grid-row mb-5">
      {items.map((item, index) => (
        <div key={item.id} style={{ width: `${100 * (widths[index] + spacing_per) / screen_width}%` }}>
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
            href={`https://old.reddit.com${submission.permalink}`}
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
