import React, { createContext, useEffect, useState } from "react"
import { Navbar } from "./navbar"
import { LinkLoader } from "./submissions"
import { get, wrapAsync } from "./utils"
import { useParams, useLocation } from "react-router-dom"
import { AppDetails, AppGlobals, AppState, LoadId, SortBy, TimeFilter } from "./data"


export const AppContext = createContext<AppGlobals>(null)

export function App() {
  const { subreddit, multiOwner, multiName } = useParams()
  const { search } = useLocation()

  const [state, set_state] = useState<AppState>(null)

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
      { name: "curated", label: "Curated", has_time_filter: false },
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

  if (state == null) {
    return <></>
  }
  
  const feedId =
    state.details.multis.find(m => m.owner === multiOwner && m.name === multiName)?.feed_id

  const { reddit_user, sort_method, time_filter } = state

  const loadId: LoadId = {
    reddit_user,
    subreddit,
    multi_owner: multiOwner,
    multi_name: multiName,
    feed_id: feedId,
    sort_method,
    time_filter,
    search,
  }

  const loadKey = JSON.stringify(loadId)

  return (
    <AppContext.Provider value={globals}>
      <Navbar />
      <div className="container-fluid mt-5 pt-4">
        <LinkLoader key={loadKey} load_id={loadId} />
      </div>
    </AppContext.Provider>
  )
}

const REDDIT_USER_KEY = "reddit-user"
