import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from "react"
import { AppContext } from "./app"
import { ThemeSelector } from "./theme"
import { ServiceClientContext, SVC_WEB_ROOT } from "./utils"
import {
  DENSITIES,
  Density,
  LoadId,
  Location,
  Locations,
  SortBy,
  SORT_METHODS,
  TimeFilter,
  TIME_FILTERS,
} from "./data"

export interface UpdateLoadId {
  set_page_path: (new_page_path: string) => void
  set_reddit_user: (new_reddit_user: string) => void
  set_sort_method: (new_sort_method: SortBy) => void
  set_time_filter: (new_time_filter: TimeFilter) => void
}

export interface NavbarProps {
  load_id: LoadId
  update: UpdateLoadId
  set_light_mode: (is_light_mode: boolean) => void
  set_show_nsfw: (show_nsfw: boolean) => void
  set_density: (density: Density) => void
}

export function Navbar(props: NavbarProps) {
  const { update, load_id, set_light_mode, set_show_nsfw, set_density } = props
  const { reddit_user, page_path, sort_method, time_filter } = load_id

  const service_client = useContext(ServiceClientContext)

  const { app_details, is_light_mode, show_nsfw, density } = useContext(AppContext)
  const { reddit_users, is_authenticated } = app_details

  const [page_location, set_page_location] = useState<Location | null>(null)
  const [multis, set_multis] = useState<Location[] | null>(null)
  const [subreddits, set_subreddits] = useState<Location[] | null>(null)

  useEffect(() => {
    async function load_locations(
      path: string,
      set_locations: Dispatch<SetStateAction<Location[] | null>>
    ): Promise<void> {
      if (!is_authenticated) {
        set_locations([])
        return
      }

      const search_params = new URLSearchParams()
      if (reddit_user != null) {
        search_params.set("user", reddit_user)
      }
      const response: Locations = await (
        await service_client.get(`${path}?${search_params}`)
      ).json()
      set_locations(response.locations)
    }

    load_locations("/svc/api/me/multis/", set_multis)
    load_locations("/svc/api/me/subreddits/", set_subreddits)
  }, [service_client, is_authenticated, reddit_user])

  useEffect(() => {
    async function update_display_name(): Promise<void> {
      if (page_path !== page_location?.page_path) {
        set_page_location(null)
        const search_params = new URLSearchParams()
        search_params.set("page_path", page_path)
        if (reddit_user != null) {
          search_params.set("user", reddit_user)
        }
        const response: Location = await (
          await service_client.get(
            `/svc/api/submissions/get_display_name/?${search_params}`
          )
        ).json()
        set_page_location(response)
      }
    }

    update_display_name()
  }, [service_client, is_authenticated, reddit_user, page_path, page_location])

  function go_to_page(location: Location): void {
    set_page_location(location)
    update.set_page_path(location.page_path)
  }

  const loading_spinner = (
    <div className="spinner-grow spinner-grow-sm" role="status">
      <span className="sr-only">Loading...</span>
    </div>
  )

  const navbar_class = is_light_mode ? "navbar-light bg-light" : "navbar-dark bg-dark"

  return (
    <nav className={`navbar fixed-top navbar-expand-lg ${navbar_class} py-2`}>
      <div className="container">
        <a className="navbar-brand" href="/">
          noscroll
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle"
                id="feedDropdown"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {page_location ? page_location.display_name : loading_spinner}
              </button>
              <div className="dropdown-menu" aria-labelledby="feedDropdown">
                <FeedButton
                  location={{ display_name: "Home", page_path: "" }}
                  page_path={page_path}
                  go_to_page={go_to_page}
                />
                <FeedButton
                  location={{ display_name: "Popular", page_path: "r/Popular" }}
                  page_path={page_path}
                  go_to_page={go_to_page}
                />
                <FeedButton
                  location={{ display_name: "All", page_path: "r/All" }}
                  page_path={page_path}
                  go_to_page={go_to_page}
                />

                {multis == null && (
                  <div className="text-center">
                    <div className="dropdown-divider" />
                    {loading_spinner}
                  </div>
                )}
                {multis != null && multis.length > 0 && (
                  <>
                    <div className="dropdown-divider" />
                    <h6 className="dropdown-header">Custom feeds</h6>
                    {multis.map((multi) => (
                      <FeedButton
                        key={multi.page_path}
                        location={multi}
                        page_path={page_path}
                        go_to_page={go_to_page}
                      />
                    ))}
                  </>
                )}

                {subreddits == null && (
                  <div className="text-center">
                    <div className="dropdown-divider" />
                    {loading_spinner}
                  </div>
                )}
                {subreddits != null && subreddits.length > 0 && (
                  <>
                    <div className="dropdown-divider" />
                    <h6 className="dropdown-header">Subreddits</h6>
                    {subreddits.map((subreddit) => (
                      <FeedButton
                        key={subreddit.page_path}
                        location={subreddit}
                        page_path={page_path}
                        go_to_page={go_to_page}
                      />
                    ))}
                  </>
                )}
              </div>
            </li>
            <li className="nav-item dropdown">
              <button
                className="btn btn-link nav-link dropdown-toggle"
                id="sortDropdown"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {sort_method.label}
              </button>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                {SORT_METHODS.map((sort) => (
                  <button
                    key={sort.name}
                    type="button"
                    className={`dropdown-item${
                      sort.name === sort_method.name ? " active" : ""
                    }`}
                    onClick={() => update.set_sort_method(sort)}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </li>
            {sort_method.has_time_filter && (
              <li className="nav-item active dropdown">
                <button
                  className="btn btn-link nav-link dropdown-toggle"
                  id="timeDropdown"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {time_filter.label}
                </button>
                <div className="dropdown-menu" aria-labelledby="timeDropdown">
                  {TIME_FILTERS.map((time) => (
                    <button
                      key={time.name}
                      type="button"
                      className={`dropdown-item${
                        time.name === time_filter.name ? " active" : ""
                      }`}
                      onClick={() => update.set_time_filter(time)}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </li>
            )}
          </ul>
          <form className="form-inline">
            <div className="input-group py-2 py-lg-0 mr-sm-2">
              <div className="custom-control custom-switch">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="blur-nsfw"
                  defaultChecked={!show_nsfw}
                  onClick={() => set_show_nsfw(!show_nsfw)}
                />
                <label className="custom-control-label" htmlFor="blur-nsfw">
                  Blur NSFW
                </label>
              </div>
            </div>
            <div className="input-group py-2 py-lg-0 mr-sm-2">
              <ThemeSelector set_light_mode={set_light_mode} />
            </div>
            <div className="input-group py-2 py-lg-0">
              <>
                <button
                  className="btn btn-link dropdown-toggle"
                  id="density-dropdown"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  Density
                </button>
                <div className="dropdown-menu" aria-labelledby="density-dropdown">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.name}
                      className={`dropdown-item${
                        d.name === density.name ? " active" : ""
                      }`}
                      type="button"
                      onClick={() => set_density(d)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </>
            </div>
            <div className="input-group py-2 py-lg-0">
              {!is_authenticated && (
                <a
                  href={`${SVC_WEB_ROOT}/svc/accounts/reddit/login/?process=login`}
                  className="btn btn-primary"
                >
                  Login
                </a>
              )}
              {is_authenticated && (
                <>
                  <button
                    className="btn btn-link dropdown-toggle"
                    id="userDropdown"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {reddit_user}
                  </button>
                  <div className="dropdown-menu" aria-labelledby="userDropdown">
                    {reddit_users.length > 1 && (
                      <>
                        {reddit_users.map((user) => (
                          <button
                            key={user}
                            className={`dropdown-item${
                              user === reddit_user ? " active" : ""
                            }`}
                            type="button"
                            onClick={() => update.set_reddit_user(user)}
                          >
                            {user}
                          </button>
                        ))}
                        <div className="dropdown-divider"></div>
                      </>
                    )}
                    <a
                      href={`${SVC_WEB_ROOT}/svc/accounts/logout/`}
                      className="dropdown-item"
                    >
                      Logout
                    </a>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </nav>
  )
}

interface FeedButtonProps {
  location: Location
  page_path: string
  go_to_page: (location: Location) => void
}

function FeedButton(props: FeedButtonProps) {
  const active = props.page_path === props.location.page_path
  return (
    <button
      type="button"
      className={`dropdown-item${active ? " active" : ""}`}
      onClick={() => props.go_to_page(props.location)}
    >
      {props.location.display_name}
    </button>
  )
}
