import React, { useState, useEffect, memo } from "react"
import ReactDOM from "react-dom"
import "./index.css"
import * as serviceWorker from "./serviceWorker"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
} from "react-router-dom"

function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

function wrapAsync(func: () => Promise<any>): () => void {
  return () => {
    func().catch((e) => console.error(e))
  }
}

async function get(url: string, init?: RequestInit): Promise<Response> {
  return checkResponse(await fetch(url, init))
}

async function put(
  url: string,
  bodyJsonData: any,
  init?: RequestInit
): Promise<Response> {
  if (init == null) {
    init = {}
  }
  if (init.headers == null) {
    init.headers = {}
  }
  if (bodyJsonData != null) {
    init.headers["Content-Type"] = "application/json"
    init.headers["X-CSRFToken"] = getCookie("csrftoken")
    init.body = JSON.stringify(bodyJsonData)
  }
  init.method = "PUT"
  return checkResponse(await fetch(url, init))
}

function checkResponse(response: Response): Response {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response
}

interface Feed {
  id?: string
  name: string
}

interface FeedSelectorProps {
  feeds: Feed[]
  currFeed: Feed
}

const FeedSelectorFunc = (props: FeedSelectorProps) => (
  <div className="dropdown my-3">
    <button
      className="btn btn-primary dropdown-toggle"
      type="button"
      id="feed-selector-button"
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
    >
      {props.currFeed.name}
    </button>
    <div className="dropdown-menu" aria-labelledby="feed-selector-button">
      {props.feeds.map((feed) => (
        <Link key={feed.id} className="dropdown-item" to={`/${feed.id}`}>
          {feed.name}
        </Link>
      ))}
    </div>
  </div>
)
const FeedSelector = memo(FeedSelectorFunc)

const SubmissionDisplayFunc = ({ submission }) => (
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
)
const SubmissionDisplay = memo(SubmissionDisplayFunc)

const AllFeedsPlaceholder: Feed = {
  id: "",
  name: "All",
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

function LinkLoader() {
  const pageSize = 10

  var { feedId, subreddit, multiOwner, multiName } = useParams()

  const [feeds, setFeeds] = useState([AllFeedsPlaceholder])
  const [nextLoad, setNextLoad] = useState<LoadState>({})
  const [results, setResults] = useState<ResultsState>({ submissions: [] })
  const [pageIndex, setPageIndex] = useState(0)

  var currFeed = feeds.find((feed) => feed.id === feedId)
  if (currFeed == null) {
    currFeed = feeds[0]
  }

  useEffect(
    wrapAsync(async () => {
      const response = await get("/svc/api/feeds/")
      const result = await response.json()
      setFeeds([AllFeedsPlaceholder, ...result.results])
    }),
    []
  )

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
      setResults(lastResults => ({ submissions: [...lastResults.submissions, ...result.results] }))
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
      setNextLoad(nl => ({ ...nl, after: lastSubmission.id }))
    }
  }

  const markAsRead = wrapAsync(async () => {
    const start = pageIndex * pageSize
    const end = (pageIndex + 1) * pageSize
    const ids = results.submissions.slice(start, end).map(s => s.id)
    await put("/svc/api/submissions/mark_seen/", { ids })
  })

  return (
    <>
      <FeedSelector feeds={feeds} currFeed={currFeed} />
      {results.submissions.slice(0, (pageIndex + 1) * pageSize).map(submission => (
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

const LIGHT_MODE_KEY = "light-mode-enabled"

function isLightModeEnabled(): boolean {
  return localStorage.getItem(LIGHT_MODE_KEY) != null
}

function enableTheme(): void {
  const dark: any = document.getElementById("dark-stylesheet")
  const light: any = document.getElementById("light-stylesheet")

  const isLight = isLightModeEnabled()

  if (isLight && light.disabled) {
    light.disabled = false
    dark.disabled = true
  } else if (!isLight && dark.disabled) {
    light.disabled = true
    dark.disabled = false
  }
}

function toggleLightModeEnabled(): void {
  if (isLightModeEnabled()) {
    localStorage.removeItem(LIGHT_MODE_KEY)
  } else {
    localStorage.setItem(LIGHT_MODE_KEY, "true")
  }
  enableTheme()
}

function ThemeSelectorFunc() {
  return (
    <div className="custom-control custom-switch">
      <input type="checkbox" className="custom-control-input" id={LIGHT_MODE_KEY} defaultChecked={isLightModeEnabled()} onClick={toggleLightModeEnabled} />
      <label className="custom-control-label" htmlFor={LIGHT_MODE_KEY}>Light mode</label>
    </div>
  )
}

enableTheme()

const SVC_WEB_ROOT = window.location.port === "3000" ? "http://localhost:8000" : ""

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <div className="container-fluid d-flex flex-column align-items-center">
        <div className="container d-flex flex-column align-items-center">
          <h1>noscroll</h1>
        </div>
        <div className="mb-3">
          <a href={`${SVC_WEB_ROOT}/svc/accounts/login/`} className="btn btn-primary mr-2">Login</a>
          <a href={`${SVC_WEB_ROOT}/svc/accounts/logout/`} className="btn btn-primary">Logout</a>
        </div>
        <ThemeSelectorFunc />
        <Switch>
          <Route path="/" exact>
            <LinkLoader />
          </Route>
          <Route path="/r/:subreddit/" exact>
            <LinkLoader />
          </Route>
          <Route path="/m/:multiOwner/:multiName/" exact>
            <LinkLoader />
          </Route>
        </Switch>
      </div>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
