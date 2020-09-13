import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import * as serviceWorker from './serviceWorker';

const Link = ({ link }) => <>
  <div className="container-fluid d-flex flex-column align-items-center">
    {link.embed && <div dangerouslySetInnerHTML={{ __html: link.embed }} />}
  </div>
  <div className="container d-flex flex-column align-items-center">
    <b><a rel="noopener noreferrer" target="_blank" href={link.url}>{link.title}</a></b>
    <div><small>{link.subreddit} - <a rel="noopener noreferrer" target="_blank" href={`https://old.reddit.com${link.permalink}`}>{link.num_comments} comments</a> - {link.posted_at} - {link.score}</small></div>
  </div>
</>

function LinkList() {
  const [result, setResult] = useState({} as any)

  async function getLinks(): Promise<void> {
    try {
      const response = await fetch("/svc/api/links/?is_read=false&ordering=-score")
      if (!response.ok) {
        throw new Error(`Response not ok, status:${response.status} statusText:${response.statusText}`)
      }
      setResult(await response.json())
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    getLinks()
  }, [])

  const links = result.results || []

  return <>
    {links.map(link => <Link link={link} />)}
  </>
}

ReactDOM.render(
  <React.StrictMode>
    <div className="container">
      <h1>noscroll</h1>
    </div>
    <LinkList />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
