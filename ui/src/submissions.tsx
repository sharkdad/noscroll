import React, { useState, useEffect, memo } from "react"
import { useParams } from "react-router-dom"
import { wrapAsync, put, get } from "./utils"


export function LinkLoader() {
  const pageSize = 10

  var { subreddit, multiOwner, multiName } = useParams()

  const [nextLoad, setNextLoad] = useState<LoadState>({})
  const [results, setResults] = useState<ResultsState>({ submissions: [] })
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(
    wrapAsync(async () => {
      setResults({ submissions: [] })
      setNextLoad({ id: { subreddit, multiOwner, multiName } })
    }),
    [subreddit, multiOwner, multiName]
  )

  useEffect(
    wrapAsync(async () => {
      const loadId = nextLoad.id
      if (loadId == null) {
        return
      }

      const searchParams = new URLSearchParams()

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
        <button
          type="button"
          className="btn btn-primary mb-5"
          onClick={loadMore}
        >
          Load more
        </button>
      )}
    </>
  )
}


interface LoadId {
  subreddit?: string
  multiOwner?: string
  multiName?: string
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
  <div className="d-flex flex-column align-items-center mb-5">
    <div className="container d-flex flex-column align-items-center">
      <b>
        <a rel="noopener noreferrer" target="_blank" href={submission.url}>
          {submission.title}
        </a>
      </b>
      <div>
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
      </div>
    </div>
    {submission.embed && (
      <section
        className="d-inline-block mt-2"
        dangerouslySetInnerHTML={{ __html: submission.embed }}
      />
    )}
  </div>
))