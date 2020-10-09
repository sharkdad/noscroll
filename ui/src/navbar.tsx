import React, { memo } from "react"
import { ThemeSelector } from "./theme"
import { SVC_WEB_ROOT } from "./utils"


export const Navbar = memo(() => {
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
                id="navbarDropdown"
                role="button"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Home <span className="sr-only">(current)</span>
              </a>
              <div className="dropdown-menu" aria-labelledby="navbarDropdown">
                <a className="dropdown-item" href="#">
                  Action
                </a>
                <a className="dropdown-item" href="#">
                  Another action
                </a>
                <div className="dropdown-divider"></div>
                <a className="dropdown-item" href="#">
                  Something else here
                </a>
              </div>
            </li>
          </ul>
          <form className="form-inline">
            <div className="input-group py-2 py-lg-0 mr-sm-2">
              <ThemeSelector />
            </div>
            <div className="input-group py-2 py-lg-0">
              <a
                href={`${SVC_WEB_ROOT}/svc/accounts/login/`}
                className="btn btn-primary mr-2"
              >
                Login
              </a>
              <a
                href={`${SVC_WEB_ROOT}/svc/accounts/logout/`}
                className="btn btn-primary"
              >
                Logout
              </a>
            </div>
          </form>
        </div>
      </div>
    </nav>
  )
})