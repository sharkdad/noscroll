import React, { useState, useEffect, memo } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams
} from "react-router-dom";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function callAsync(func: () => Promise<any>): void {
  func().catch(e => console.error(e))
}

async function get(url: string, init?: RequestInit): Promise<Response> {
  return checkResponse(await fetch(url, init))
}

async function put(url: string, bodyJsonData: any, init?: RequestInit): Promise<Response> {
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
    throw new Error(`Response not ok, status:${response.status} statusText:${response.statusText}`)
  }
  return response
}

interface Feed {
  id: string
  name: string
}

interface FeedSelectorProps {
  feeds: Feed[]
  currFeed: Feed
}

const FeedSelectorFunc = (props: FeedSelectorProps) =>
  <div className="dropdown">
    <button className="btn btn-secondary dropdown-toggle" type="button" id="feed-selector-button" data-toggle="dropdown"
      aria-haspopup="true" aria-expanded="false">
      {props.currFeed.name}
    </button>
    <div className="dropdown-menu" aria-labelledby="feed-selector-button">
      {props.feeds.map(feed => <Link className="dropdown-item" to={`/${feed.id}`}>{feed.name}</Link>)}
    </div>
  </div>
const FeedSelector = memo(FeedSelectorFunc)

const LinkListFunc = ({ links }) => <>
  {links.map(link => <div key={link.id} className="d-flex flex-column align-items-center mb-5">
    <div className="container d-flex flex-column align-items-center">
      <b><a rel="noopener noreferrer" target="_blank" href={link.url}>{link.title}</a></b>
      <div><small>
        {link.subreddit}
      &nbsp;- <a rel="noopener noreferrer" target="_blank"
          href={`https://old.reddit.com${link.permalink}`}>{link.num_comments} comments</a>
      &nbsp;- {link.posted_at}
      &nbsp;- {link.score}
      </small></div>
    </div>
    {link.embed && <span className="d-inline-block mt-2" dangerouslySetInnerHTML={{ __html: link.embed }} />}
  </div>)}
</>
const LinkList = memo(LinkListFunc)

const AllFeedsPlaceholder: Feed = {
  id: "",
  name: "All"
}

function LinkLoader() {
  var { feedId } = useParams()

  feedId = feedId == null ? "" : feedId

  const [feeds, setFeeds] = useState([AllFeedsPlaceholder])
  const [nextLoad, setNextLoad] = useState({ readLinks: [] })
  const [results, setResults] = useState([] as any[])

  var currFeed = feeds.find(feed => feed.id === feedId)
  if (currFeed == null) {
    currFeed = feeds[0]
  }

  useEffect(() => callAsync(async () => {
    const response = await get("/svc/api/feeds/")
    const result = await response.json()
    setFeeds([AllFeedsPlaceholder, ...result.results])
  }), [])

  useEffect(() => callAsync(async () => {
    if (nextLoad.readLinks.length > 0) {
      const readLinkIds = nextLoad.readLinks.map(link => link.id)
      await put("/svc/api/links/mark_read/", { link_ids: readLinkIds })
    }

    var queryparams = "is_read=false&ordering=-score"
    if (currFeed.id !== "") {
      queryparams += `&feeds=${currFeed.id}`
    }

    const response = await get(`/svc/api/links/?${queryparams}`)
    const result = await response.json()
    setResults(r => [...r, result])
  }), [nextLoad, currFeed])

  function loadMore() {
    setNextLoad({ readLinks: results[results.length - 1].results })
  }

  return <>
    <FeedSelector feeds={feeds} currFeed={currFeed} />
    {results.map((result, index) => <LinkList links={result.results} key={index} />)}
    {results.length > 0 && <button type="button" className="btn btn-primary mb-5" onClick={loadMore}>Load more</button>}
  </>
}

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <div className="container-fluid d-flex flex-column align-items-center">
        <div className="container d-flex flex-column align-items-center">
          <h1>noscroll</h1>
        </div>
        <Switch>
          <Route path="/:feedId?/">
            <LinkLoader />
          </Route>
        </Switch>
      </div>
    </Router>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();