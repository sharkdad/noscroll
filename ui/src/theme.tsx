import React, { memo, useContext } from "react"
import { AppContext } from "./app"

export function enableTheme(): void {
  const dark: any = document.getElementById("dark-stylesheet")
  const light: any = document.getElementById("light-stylesheet")

  const isLight = is_light_mode_enabled()

  if (isLight && light.disabled) {
    light.disabled = false
    dark.disabled = true
  } else if (!isLight && dark.disabled) {
    light.disabled = true
    dark.disabled = false
  }
}

export interface ThemeSelectorProps {
  set_light_mode: (is_light_mode: boolean) => void
}

export const ThemeSelector = memo((props: ThemeSelectorProps) => {
  const { is_light_mode } = useContext(AppContext)

  function toggleLightModeEnabled(): void {
    if (is_light_mode) {
      localStorage.removeItem(LIGHT_MODE_KEY)
      props.set_light_mode(false)
    } else {
      localStorage.setItem(LIGHT_MODE_KEY, "true")
      props.set_light_mode(true)
    }
    enableTheme()
  }

  return (
    <div className="custom-control custom-switch">
      <input
        type="checkbox"
        className="custom-control-input"
        id={LIGHT_MODE_KEY}
        defaultChecked={is_light_mode_enabled()}
        onClick={toggleLightModeEnabled}
      />
      <label className="custom-control-label" htmlFor={LIGHT_MODE_KEY}>
        Light mode
      </label>
    </div>
  )
})

const LIGHT_MODE_KEY = "light-mode-enabled"

export function is_light_mode_enabled(): boolean {
  return localStorage.getItem(LIGHT_MODE_KEY) != null
}
