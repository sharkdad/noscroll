import { createContext } from "react"

export const SVC_WEB_ROOT =
  window.location.port === "3000" ? "http://localhost:8000" : ""

export const ServiceClientContext = createContext<ServiceClient>(null)

export class ServiceClient {
  private next_error_report = Date.now()

  constructor(private set_slow_load: () => void, private clear_slow_load: () => void) {}

  async report_error(error?: any, extra?: any): Promise<void> {
    try {
      const now = Date.now()
      if (now >= this.next_error_report) {
        this.next_error_report = now + 5000 + (Math.random() * 500)
        const message = `${error?.message}\n${error?.stack}`
        const init = this.build_put_request({ message, extra })
        checkResponse(await fetch("/svc/api/app/report_error/", init))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async get(url: string, init?: RequestInit): Promise<Response> {
    return this.do_request(() => fetch(url, init))
  }

  async put(url: string, bodyJsonData: any, init?: RequestInit): Promise<Response> {
    return this.do_request(() => fetch(url, this.build_put_request(bodyJsonData, init)))
  }

  private build_put_request(bodyJsonData: any, init?: RequestInit): RequestInit {
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
    return init
  }

  private async do_request(request: () => Promise<Response>): Promise<Response> {
    let was_slow = false
    const timeout = setTimeout(() => {
      was_slow = true
      this.set_slow_load()
    }, 5000)
    try {
      return await retry(async () => {
        const response = await request()
        checkResponse(response)
        return response
      }, { reportError: (err) => this.report_error(err) })
    } finally {
      clearTimeout(timeout)
      if (was_slow) {
        this.clear_slow_load()
      }
    }
  }
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

export interface RetryOptions {
  exponentialBackoffLimit: number
  initialDelayMs: number
  maxJitterMs: number
  reportError: (err: any) => any
}

const defaultRetryOptions: RetryOptions = {
  exponentialBackoffLimit: 4,
  initialDelayMs: 500,
  maxJitterMs: 500,
  reportError: function() {},
}

export function delay(timeMs: number): Promise<void> {
  return new Promise((fulfill) => setTimeout(fulfill, timeMs))
}

export async function retry<T>(
  thing: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const effectiveOptions = { ...defaultRetryOptions, ...options }
  let exponentialBackoff = 0
  while (true) {
    try {
      return await thing()
    } catch (err) {
      console.error(err)
      options.reportError(err)
      const baseDelay =
        Math.pow(2, exponentialBackoff) * effectiveOptions.initialDelayMs
      const jitter = Math.random() * effectiveOptions.maxJitterMs
      await delay(baseDelay + jitter)

      if (exponentialBackoff < effectiveOptions.exponentialBackoffLimit) {
        exponentialBackoff++
      }
    }
  }
}
