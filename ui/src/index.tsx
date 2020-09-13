import React, { useState, useEffect, memo } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

function callAsync(func: () => Promise<any>): void {
  func().catch(e => console.error(e))
}

var LinkList = ({ links }) => <>
  {links.map(link => <div key={link.id}>
    {link.embed && <div dangerouslySetInnerHTML={{ __html: link.embed }} />}
    <div className="container d-flex flex-column align-items-center">
      <b><a rel="noopener noreferrer" target="_blank" href={link.url}>{link.title}</a></b>
      <div><small>
        {link.subreddit}
      - <a rel="noopener noreferrer" target="_blank"
          href={`https://old.reddit.com${link.permalink}`}>{link.num_comments} comments</a>
      - {link.posted_at}
      - {link.score}
      </small></div>
    </div>
  </div>)}
</>
LinkList = memo(LinkList)

function LinkLoader() {
  const [numLoads, setNumLoads] = useState(0)
  const [results, setResults] = useState([] as any[])

  useEffect(() => callAsync(async () => {
    const response = await fetch("/svc/api/links/?is_read=false&ordering=-score")
    if (!response.ok) {
      throw new Error(`Response not ok, status:${response.status} statusText:${response.statusText}`)
    }
    const result = await response.json()
    setResults(r => [...r, result])
  }), [numLoads])

  return <>
    {results.map((result, index) => <LinkList links={result.results} key={index} />)}
    <button type="button" className="btn btn-primary" onClick={() => setNumLoads(n => n + 1)}>Load more</button>
  </>
}

ReactDOM.render(
  <React.StrictMode>
    <div className="container-fluid d-flex flex-column align-items-center">
      <div className="container d-flex flex-column align-items-center">
        <h1>noscroll</h1>
      </div>
      <LinkLoader />
    </div>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();