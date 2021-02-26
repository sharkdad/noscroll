export const SVC_WEB_ROOT =
  window.location.port === "3000" ? "http://localhost:8000" : ""

export function wrapAsync(func: () => Promise<any>): () => void {
  return () => callAsync(func)
}

export function callAsync(func: () => Promise<any>): void {
  func().catch((e) => console.error(e))
}

export async function get(url: string, init?: RequestInit): Promise<Response> {
  return checkResponse(await fetch(url, init))
}

export async function put(
  url: string,
  bodyJsonData: any,
  init?: RequestInit
): Promise<Response> {
  if (init == null) {
    init = {}
  }
  if (init.headers == null) {
    init.headers = {}
  }
  if (bodyJsonData != null) {
    init.headers["Content-Type"] = "application/json"
    init.headers["X-CSRFToken"] = getCookie("csrftoken")
    init.body = JSON.stringify(bodyJsonData)
  }
  init.method = "PUT"
  return checkResponse(await fetch(url, init))
}

function getCookie(name) {
  let cookieValue = null
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
        break
      }
    }
  }
  return cookieValue
}

function checkResponse(response: Response): Response {
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response
}
