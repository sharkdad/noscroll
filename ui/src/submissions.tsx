import React, { useState, useEffect, memo, useContext } from "react"
import { useParams } from "react-router-dom"
import { AppContext, SortBy, TimeFilter } from "./app"
import { wrapAsync, put, get } from "./utils"

export function LinkLoader() {
  const pageSize = 10

  const { state } = useContext(AppContext)
  const { reddit_user, sort_method, time_filter } = state

  const { subreddit, multiOwner, multiName } = useParams()

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
        },
      })
    }),
    [reddit_user, subreddit, multiOwner, multiName, sort_method, time_filter]
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

  return (
    <>
      {results.submissions
        .slice(0, (pageIndex + 1) * pageSize)
        .map((submission) => (
          <SubmissionDisplay key={submission.id} submission={submission} />
        ))}
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
}

interface LoadState {
  id?: LoadId
  after?: string
}

interface ResultsState {
  submissions: any[]
}

interface SubmissionDisplayProps {
  submission: any
}

const SubmissionDisplay = memo<SubmissionDisplayProps>(({ submission }) => (
  <>
    <div className="container text-center">
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
      <div className="w-100 text-center"
        dangerouslySetInnerHTML={{ __html: submission.embed }}
      />
    )}
    <div className="mb-5"/>
  </>
))
