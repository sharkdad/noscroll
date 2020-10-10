import React, { useContext } from "react"
import { AppContext } from "./app"
import { ThemeSelector } from "./theme"
import { SVC_WEB_ROOT } from "./utils"

export function Navbar() {
  const {
    state,
    sort_methods,
    time_filters,
    set_reddit_user,
    set_sort_method,
    set_time_filter,
  } = useContext(AppContext)
  const { details, reddit_user, sort_method, time_filter } = state
  const reddit_users = details.reddit_users
  const other_users = reddit_users.filter((u) => u !== reddit_user)
  const other_sort_methods = sort_methods.filter(
    (s) => s.name !== sort_method.name
  )
  const other_time_filters = time_filters.filter(
    (t) => t.name !== time_filter.name
  )
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
                id="sortDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {sort_method.label}
              </a>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                {other_sort_methods.map((sort) => (
                  <button
                    key={sort.name}
                    type="button"
                    className="dropdown-item"
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
                  {other_time_filters.map((time) => (
                    <button
                      key={time.name}
                      type="button"
                      className="dropdown-item"
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
                    {other_users.map((user) => (
                      <button
                        key={user}
                        className="dropdown-item"
                        type="button"
                        onClick={() => set_reddit_user(user)}
                      >
                        {user}
                      </button>
                    ))}
                    {other_users.length > 0 && (
                      <div className="dropdown-divider"></div>
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
