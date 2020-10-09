import React, { memo } from "react"


export function enableTheme(): void {
  const dark: any = document.getElementById("dark-stylesheet")
  const light: any = document.getElementById("light-stylesheet")

  const isLight = isLightModeEnabled()

  if (isLight && light.disabled) {
    light.disabled = false
    dark.disabled = true
  } else if (!isLight && dark.disabled) {
    light.disabled = true
    dark.disabled = false
  }
}

export const ThemeSelector = memo(() => {
  function toggleLightModeEnabled(): void {
    if (isLightModeEnabled()) {
      localStorage.removeItem(LIGHT_MODE_KEY)
    } else {
      localStorage.setItem(LIGHT_MODE_KEY, "true")
    }
    enableTheme()
  }

  return (
    <div className="custom-control custom-switch">
      <input
        type="checkbox"
        className="custom-control-input"
        id={LIGHT_MODE_KEY}
        defaultChecked={isLightModeEnabled()}
        onClick={toggleLightModeEnabled}
      />
      <label className="custom-control-label" htmlFor={LIGHT_MODE_KEY}>
        Light mode
      </label>
    </div>
  )
})


const LIGHT_MODE_KEY = "light-mode-enabled"

function isLightModeEnabled(): boolean {
  return localStorage.getItem(LIGHT_MODE_KEY) != null
}