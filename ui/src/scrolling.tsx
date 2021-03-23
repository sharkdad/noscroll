import { createRef, Dispatch, RefObject, SetStateAction } from "react"
import { LoadId } from "./data"
import { callAsync, get, put } from "./utils"

export interface SubmissionLoadingState {
  results: any[]
  is_loading: boolean
}

export class ScrollHandler {
  private observer: IntersectionObserver
  private item_divs: RefObject<HTMLDivElement>[] = []
  private last_seen_div?: HTMLElement
  private next_observe_idx = 0

  private seen_ids = new Set<string>()
  private read_ids = new Set<string>()

  private next?: string = null
  private after?: string = null
  private is_more_results = true

  constructor(
    private load_id: LoadId,
    private set_page_index: Dispatch<SetStateAction<number>>,
    private set_loading_state: Dispatch<SetStateAction<SubmissionLoadingState>>
  ) {
    this.observer = new IntersectionObserver(this.intersection_change, {
      threshold: [0, 1],
    })
  }

  expand_item_refs(item_count: number): void {
    const new_item_count = item_count - this.item_divs.length
    if (new_item_count > 0) {
      const new_refs = Array.from({ length: new_item_count }, () =>
        createRef<HTMLDivElement>()
      )
      this.item_divs = [...this.item_divs, ...new_refs]
    }
  }

  get_item_ref(index: number): RefObject<HTMLDivElement> {
    return this.item_divs[index]
  }

  async load_first_page(): Promise<void> {
    await this.load_more()
    this.set_page_index(0)
  }

  observe_new_items(): void {
    if (this.next_observe_idx < this.item_divs.length) {
      const new_divs = this.item_divs.slice(this.next_observe_idx)
      new_divs.forEach((ref) => this.observer.observe(ref.current))
      this.next_observe_idx = this.item_divs.length
    }
  }

  scroll_to_last_seen(): void {
    if (this.last_seen_div != null) {
      const rect = this.last_seen_div.getBoundingClientRect()
      window.scrollTo({ top: rect.top + window.scrollY })
    }
    this.item_divs.forEach((ref) => this.observer.observe(ref.current))
    this.next_observe_idx = this.item_divs.length
  }

  async mark_as_read(is_authenticated: boolean): Promise<void> {
    const ids = Array.from(this.read_ids)
    if (ids.length > 0) {
      if (is_authenticated && this.load_id.sort_method.name === "curated") {
        await put("/svc/api/submissions/mark_seen/", { ids })
      }
      ids.forEach((id) => this.read_ids.delete(id))
    }
  }

  private intersection_change: IntersectionObserverCallback = (entries) => {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement
      const reddit_id = element.dataset.redditId
      if (entry.isIntersecting) {
        if (!this.seen_ids.has(reddit_id)) {
          this.last_seen_div = element
          this.seen_ids.add(reddit_id)
          if (element.dataset.showNextPage === "true") {
            this.set_page_index((last_index) => last_index + 1)
          }
          if (element.dataset.loadMore === "true" && this.is_more_results) {
            callAsync(() => this.load_more())
          }
        }
      } else if (this.seen_ids.has(reddit_id) && entry.boundingClientRect.top <= 0) {
        if (entry.boundingClientRect.top < 0) {
          this.read_ids.add(reddit_id)
        }
        this.seen_ids.delete(reddit_id)
        this.observer.unobserve(element)
      }
    })
  }

  private async load_more(): Promise<void> {
    this.set_loading_state((state) => ({ ...state, is_loading: true }))
    var url = ""
    if (this.next != null) {
      url = this.next
    } else if (this.load_id.sort_method.name === "curated") {
      const searchParams = new URLSearchParams()
      searchParams.set("min_score", "500")
      searchParams.set("feeds", this.load_id.feed_id)

      if (this.load_id.search) {
        new URLSearchParams(this.load_id.search).forEach((value, key) =>
          searchParams.set(key, value)
        )
      }

      url = `/svc/api/links/?${searchParams}`
    } else {
      const searchParams = new URLSearchParams()
      if (this.load_id.reddit_user != null) {
        searchParams.set("user", this.load_id.reddit_user)
      }
      searchParams.set("sort", this.load_id.sort_method.name)
      if (this.load_id.sort_method.has_time_filter) {
        searchParams.set("t", this.load_id.time_filter.name)
      }

      if (this.load_id.page_path != null) {
        searchParams.set("page_path", this.load_id.page_path)
      }

      if (this.after != null) {
        searchParams.set("limit", "50")
        searchParams.set("after", this.after)
      } else {
        searchParams.set("limit", "20")
      }

      if (this.load_id.search) {
        new URLSearchParams(this.load_id.search).forEach((value, key) =>
          searchParams.set(key, value)
        )
      }

      url = `/svc/api/submissions/?${searchParams}`
    }

    const response = await (await get(url)).json()
    const last = response.results[response.results.length - 1]
    this.after = last?.id
    this.next = response.next
    this.is_more_results =
      (this.after != null && !this.load_id.search.includes("reddit_ids=")) ||
      this.next != null
    this.set_loading_state((last_state) => ({
      results: [...last_state.results, ...response.results],
      is_loading: false,
    }))
  }
}
