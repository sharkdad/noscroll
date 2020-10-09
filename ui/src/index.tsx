import React from "react"
import ReactDOM from "react-dom"
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { Navbar } from "./navbar"
import { LinkLoader } from "./submissions"
import { enableTheme } from "./theme"


enableTheme()

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Navbar />
      <div className="container-fluid d-flex flex-column align-items-center mt-5">
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
