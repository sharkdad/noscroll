import React, { createContext, useEffect, useState } from "react"
import { Navbar, UpdateLoadId } from "./navbar"
import { LinkLoader } from "./submissions"
import { useParams, useLocation, useHistory } from "react-router-dom"
import {
  AppDetails,
  AppGlobals,
  DENSITIES,
  Density,
  LoadId,
  SortBy,
  SORT_METHODS,
  TimeFilter,
  TIME_FILTERS,
} from "./data"
import { is_light_mode_enabled } from "./theme"

export const AppContext = createContext<AppGlobals>(null)

export interface AppProps {
  app_details: AppDetails
}

const SORT_METHODS_BY_NAME = new Map(SORT_METHODS.map((s) => [s.name, s]))

function get_app_path(page_path: string, sort_str: string): string {
  return `/${page_path ? `${page_path}/` : ""}${sort_str ? `${sort_str}/` : ""}`
}

const DENSITY_KEY = "density"

function get_density(): Density {
  const saved_density_str = localStorage.getItem(DENSITY_KEY)
  return DENSITIES.find((d) => d.name === saved_density_str) ?? DENSITIES[2]
}

function save_density(density: Density): void {
  localStorage.setItem(DENSITY_KEY, density.name)
}

const SHOW_NSFW_KEY = "show-nsfw"

function get_show_nsfw(): boolean {
  return localStorage.getItem(SHOW_NSFW_KEY) != null
}

function save_show_nsfw(show_nsfw: boolean): void {
  if (show_nsfw) {
    localStorage.setItem(SHOW_NSFW_KEY, "true")
  } else {
    localStorage.removeItem(SHOW_NSFW_KEY)
  }
}

export function App(props: AppProps) {
  const { app_details } = props
  const { reddit_users, feeds } = app_details

  const [app_globals, set_app_globals] = useState<AppGlobals>({
    app_details,
    is_light_mode: is_light_mode_enabled(),
    show_nsfw: get_show_nsfw(),
    density: get_density(),
  })

  function set_light_mode(is_light_mode: boolean): void {
    set_app_globals((g) => ({ ...g, is_light_mode }))
  }

  function set_show_nsfw(show_nsfw: boolean): void {
    set_app_globals((g) => ({ ...g, show_nsfw }))
    save_show_nsfw(show_nsfw)
  }

  function set_density(density: Density): void {
    set_app_globals((g) => ({ ...g, density }))
    save_density(density)
    $("#navbarSupportedContent").collapse("hide")
  }

  const full_path: string = useParams().full_path ?? ""
  const path_parts = full_path.split("/")
  const sort_method_from_path = SORT_METHODS_BY_NAME.get(
    path_parts[path_parts.length - 1]
  )
  const sort_str = sort_method_from_path?.name
  const page_path = sort_str
    ? path_parts.slice(0, path_parts.length - 1).join("/")
    : full_path

  const history = useHistory()
  const location = useLocation()
  const { search } = location
  const search_params = new URLSearchParams(search)
  const time_str = search_params.get("t")
  const url_user = search_params.get("u")

  const saved_user = localStorage.getItem(REDDIT_USER_KEY)
  const intended_user = url_user ?? saved_user
  const reddit_user = reddit_users.includes(intended_user)
    ? intended_user
    : reddit_users[0]
  useEffect(() => {
    if (reddit_user && reddit_user !== saved_user) {
      localStorage.setItem(REDDIT_USER_KEY, reddit_user)
    }
    if (reddit_users.length > 1 && url_user !== reddit_user) {
      update.set_reddit_user(reddit_user)
    }
  })

  const feed_id = feeds.find((f) => f.page_path === page_path)?.feed_id
  const sort_method = SORT_METHODS_BY_NAME.get(sort_str) ?? SORT_METHODS[0]
  const time_filter = TIME_FILTERS.find((t) => t.name === time_str) ?? TIME_FILTERS[0]

  const update: UpdateLoadId = {
    set_page_path(new_page_path: string): void {
      const pathname = get_app_path(new_page_path, sort_str)
      history.push({ ...location, pathname })
      $("#navbarSupportedContent").collapse("hide")
    },

    set_reddit_user(new_reddit_user: string): void {
      const new_search_params = new URLSearchParams(search)
      new_search_params.set("u", new_reddit_user)
      history.push({ ...location, search: `?${new_search_params}` })
      $("#navbarSupportedContent").collapse("hide")
    },

    set_sort_method(new_sort_method: SortBy): void {
      const pathname = get_app_path(page_path, new_sort_method.name)
      history.push({ ...location, pathname })
      $("#navbarSupportedContent").collapse("hide")
    },

    set_time_filter(new_time_filter: TimeFilter): void {
      const new_search_params = new URLSearchParams(search)
      new_search_params.set("t", new_time_filter.name)
      history.push({ ...location, search: `?${new_search_params}` })
      $("#navbarSupportedContent").collapse("hide")
    },
  }

  const load_id: LoadId = {
    reddit_user,
    page_path,
    feed_id,
    sort_method,
    time_filter,
    search,
  }
  const load_key = JSON.stringify(load_id)

  return (
    <AppContext.Provider value={app_globals}>
      <Navbar
        load_id={load_id}
        update={update}
        set_light_mode={set_light_mode}
        set_show_nsfw={set_show_nsfw}
        set_density={set_density}
      />
      <div className="container-fluid mt-5 pt-4 px-0">
        <LinkLoader key={load_key} load_id={load_id} />
      </div>
    </AppContext.Provider>
  )
}

const REDDIT_USER_KEY = "reddit-user"
