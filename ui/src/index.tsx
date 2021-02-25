import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import * as serviceWorker from "./serviceWorker"
import { enableTheme } from "./theme"
import { App } from "./app"
import { AppDetails } from "./data"
import { get, wrapAsync } from "./utils"

function Index() {
  const [app_details, set_app_details] = useState<AppDetails | null>(null)

  useEffect(
    wrapAsync(async () => {
      const response = await get("/svc/api/app/")
      set_app_details(await response.json())
    }),
    []
  )

  return (
    <React.StrictMode>
      <Router>
        <Switch>
          <Route exact path={"/:full_path*/"}>
            {app_details && <App app_details={app_details} />}
          </Route>
        </Switch>
      </Router>
    </React.StrictMode>
  )
}

enableTheme()
ReactDOM.render(<Index />, document.getElementById("root"))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
