import React, { memo, useContext } from "react"
import { AppContext } from "./app"
import { ThemeSelector } from "./theme"
import { SVC_WEB_ROOT } from "./utils"
import { useParams, useHistory, useLocation } from "react-router-dom"

export function Navbar() {
  const history = useHistory()
  const location = useLocation()
  const { multiOwner, multiName } = useParams()

  const {
    state,
    sort_methods,
    time_filters,
    set_reddit_user,
    set_sort_method,
    set_time_filter,
  } = useContext(AppContext)
  const { details, reddit_user, sort_method, time_filter } = state
  const { reddit_users, multis } = details

  var feed = location.pathname
  const feedMulti = multis.find(m => m.owner === multiOwner && m.name === multiName)
  if (feedMulti) {
    feed = feedMulti.display_name
  } else if (feed === "/") {
    feed = "Home"
  }

  return (
    <nav className="navbar fixed-top navbar-expand-lg navbar-dark bg-dark py-2">
      <div className="container">
        <a className="navbar-brand" href="#">
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
            <li className="nav-item active dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="feedDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {feed}
              </a>
              <div className="dropdown-menu" aria-labelledby="feedDropdown">
                <FeedButton pathname="/" label="Home" history={history} location={location} />
                <FeedButton pathname="/r/all/" history={history} location={location} />
                <FeedButton pathname="/r/popular/" history={history} location={location} />
                <div className="dropdown-divider" />
                {multis.map((multi) => {
                  const pathname = `/user/${multi.owner}/m/${multi.name}/`
                  return (
                    <FeedButton
                      key={pathname}
                      pathname={pathname}
                      label={multi.display_name}
                      history={history}
                      location={location}
                    />
                  )
                })}
              </div>
            </li>
            <li className="nav-item active dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="sortDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {sort_method.label}
              </a>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                {sort_methods.map((sort) => (
                  <button
                    key={sort.name}
                    type="button"
                    className={`dropdown-item${sort.name === sort_method.name ? " active" : ""}`}
                    onClick={() => set_sort_method(sort)}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </li>
            {sort_method.has_time_filter && (
              <li className="nav-item active dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="timeDropdown"
                  role="button"
                  data-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                >
                  {time_filter.label}
                </a>
                <div className="dropdown-menu" aria-labelledby="timeDropdown">
                  {time_filters.map((time) => (
                    <button
                      key={time.name}
                      type="button"
                      className={`dropdown-item${time.name === time_filter.name ? " active" : ""}`}
                      onClick={() => set_time_filter(time)}
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
              <ThemeSelector />
            </div>
            <div className="input-group py-2 py-lg-0">
              {!details.is_authenticated && (
                <a
                  href={`${SVC_WEB_ROOT}/svc/accounts/login/`}
                  className="btn btn-primary"
                >
                  Login
                </a>
              )}
              {details.is_authenticated && (
                <>
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="userDropdown"
                    role="button"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    {reddit_user}
                  </a>
                  <div className="dropdown-menu" aria-labelledby="userDropdown">
                    {reddit_users.length > 1 && (
                      <>
                        {reddit_users.map((user) => (
                          <button
                            key={user}
                            className={`dropdown-item${user === reddit_user ? " active" : ""}`}
                            type="button"
                            onClick={() => set_reddit_user(user)}
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
  pathname: string
  label?: string
  history: any
  location: any
}

const FeedButton = memo<FeedButtonProps>(({ pathname, label, history, location }) => (
  <button
    type="button"
    className={`dropdown-item${location.pathname === pathname ? " active" : ""}`}
    onClick={() => history.push(pathname)}
  >
    {label || pathname}
  </button>
))