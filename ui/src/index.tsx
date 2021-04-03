import React, { useContext, useEffect, useRef, useState } from "react"
import ReactDOM from "react-dom"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import * as serviceWorker from "./serviceWorker"
import { enableTheme } from "./theme"
import { App } from "./app"
import { AppDetails } from "./data"
import { ServiceClient, ServiceClientContext } from "./utils"
import "./index.css"

function ErrorHandler() {
  const [is_error, set_is_error] = useState(false)
  const [is_slow_load, set_is_slow_load] = useState(0)

  const is_error_shown = useRef(false)
  const is_slow_load_shown = useRef(false)

  const error_toast = useRef<HTMLDivElement>(null)
  const slow_load_toast = useRef<HTMLDivElement>(null)

  const service_client = useRef<ServiceClient>(
    new ServiceClient(
      () => set_is_slow_load((sl) => sl + 1),
      () => set_is_slow_load((sl) => sl - 1)
    )
  )

  useEffect(() => {
    window.addEventListener("error", (event) => {
      console.error(event)
      set_is_error(true)
    })
    window.addEventListener("unhandledrejection", (event) => {
      console.error(event)
      set_is_error(true)
    })

    $(error_toast.current).toast()
    $(error_toast.current).on("hidden.bs.toast", () => {
      is_error_shown.current = false
      set_is_error(false)
    })

    $(slow_load_toast.current).toast()
  }, [])

  useEffect(() => {
    if (is_error && !is_error_shown.current) {
      $(error_toast.current).toast("show")
      is_error_shown.current = true
    } else if (!is_error && is_error_shown.current) {
      $(error_toast.current).toast("hide")
      is_error_shown.current = false
    }

    if (is_slow_load > 0 && !is_slow_load_shown.current) {
      $(slow_load_toast.current).toast("show")
      is_slow_load_shown.current = true
    } else if (is_slow_load === 0 && is_slow_load_shown.current) {
      $(slow_load_toast.current).toast("hide")
      is_slow_load_shown.current = false
    }
  })

  return (
    <>
      <ErrorBoundary set_is_error={set_is_error}>
        <ServiceClientContext.Provider value={service_client.current}>
          <Index />
        </ServiceClientContext.Provider>
      </ErrorBoundary>

      <div aria-live="polite" aria-atomic="true" className="fixed-top">
        <div className="my-2 d-flex justify-content-center align-items-center">
          <div
            ref={error_toast}
            className="toast hide"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-autohide="false"
          >
            <div className="toast-header">
              <strong className="mr-auto">Error</strong>
              <button
                type="button"
                className="ml-2 mb-1 close"
                data-dismiss="toast"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="toast-body">
              Something blew up. You should probably{" "}
              <a href="/" onClick={() => window.location.reload()}>
                reload
              </a>
              .
            </div>
          </div>

          <div
            ref={slow_load_toast}
            className="toast hide"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-autohide="false"
          >
            <div className="toast-header">
              <strong className="mr-auto">Error</strong>
              <button
                type="button"
                className="ml-2 mb-1 close"
                data-dismiss="toast"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="toast-body">
              Something is taking longer to load than expected. We'll keep trying.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

interface ErrorBoundaryProps {
  set_is_error: (is_error: boolean) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo)
    this.props.set_is_error(true)
  }

  render() {
    return this.props.children
  }
}

function Index() {
  const [app_details, set_app_details] = useState<AppDetails | null>(null)

  const service_client = useContext(ServiceClientContext)

  useEffect(() => {
    async function load_details(): Promise<void> {
      const response = await service_client.get("/svc/api/app/")
      set_app_details(await response.json())
    }

    load_details()
  }, [service_client])

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
ReactDOM.render(<ErrorHandler />, document.getElementById("root"))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
