import React, { createContext, useEffect, useState } from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { Navbar } from "./navbar"
import { LinkLoader } from "./submissions"
import { get, wrapAsync } from "./utils"

export interface SortBy {
  name: string
  label: string
  has_time_filter: boolean
}

export interface TimeFilter {
  name: string
  label: string
}

export interface Multi {
  owner: string
  name: string
  display_name: string
}

export interface AppDetails {
  is_authenticated: boolean
  reddit_users: string[]
  multis: Multi[]
}

export interface AppState {
  details: AppDetails
  reddit_user: string
  sort_method: SortBy
  time_filter: TimeFilter
}

export interface AppGlobals {
  state: AppState
  sort_methods: SortBy[]
  time_filters: TimeFilter[]
  set_reddit_user: (reddit_user: string) => void
  set_sort_method: (sort_method: SortBy) => void
  set_time_filter: (time_filter: TimeFilter) => void
}

export const AppContext = createContext<AppGlobals>(undefined)

export function App() {
  const [state, set_state] = useState<AppState>(undefined)

  const globals: AppGlobals = {
    state,
    set_reddit_user: (user: string) => {
      localStorage.setItem(REDDIT_USER_KEY, user)
      set_state((old_state) => ({ ...old_state, reddit_user: user }))
    },
    set_sort_method: (sort_method: SortBy) => {
      set_state((old_state) => ({ ...old_state, sort_method }))
    },
    set_time_filter: (time_filter: TimeFilter) => {
      set_state((old_state) => ({ ...old_state, time_filter }))
    },
    sort_methods: [
      { name: "hot", label: "Hot", has_time_filter: false },
      { name: "top", label: "Top", has_time_filter: true },
      { name: "rising", label: "Rising", has_time_filter: false },
      { name: "new", label: "New", has_time_filter: false },
      { name: "controversial", label: "Controversial", has_time_filter: true },
    ],
    time_filters: [
      { name: "all", label: "All time" },
      { name: "year", label: "This year" },
      { name: "month", label: "This month" },
      { name: "day", label: "Today" },
      { name: "hour", label: "Now" },
    ],
  }

  useEffect(
    wrapAsync(async () => {
      const saved_user = localStorage.getItem(REDDIT_USER_KEY)
      const searchParams = new URLSearchParams()
      if (saved_user) {
        searchParams.set("user", saved_user)
      }
      const response = await get(`/svc/api/app/?${searchParams}`)
      const details: AppDetails = await response.json()
      const reddit_user = details.reddit_users.includes(saved_user)
        ? saved_user
        : details.reddit_users[0]
      const sort_method = globals.sort_methods[0]
      const time_filter = globals.time_filters[0]
      set_state({ reddit_user, details, sort_method, time_filter })
    }),
    []
  )

  return (
    <React.StrictMode>
      <Router>
        {state && (
          <AppContext.Provider value={globals}>
            <Switch>
              <Route exact path={["/", "/r/:subreddit/", "/user/:multiOwner/m/:multiName/"]}>
                <Navbar />
                <div className="container-fluid mt-5 pt-4">
                  <LinkLoader />
                </div>
              </Route>
            </Switch>
          </AppContext.Provider>
        )}
      </Router>
    </React.StrictMode>
  )
}

const REDDIT_USER_KEY = "reddit-user"
