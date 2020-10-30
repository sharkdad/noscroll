export class ScrollHandler {
  load_more: () => void
  observer: IntersectionObserver
  seen_ids = new Set<string>()
  read_ids = new Set<string>()

  constructor(load_more: () => void) {
    this.load_more = load_more
    this.observer = new IntersectionObserver(this.intersection_change,
      { threshold: [0, 1] })
  }

  observe = (div: HTMLDivElement) => this.observer.observe(div)

  intersection_change: IntersectionObserverCallback = (entries) => {
    entries.forEach(entry => {
      const element = entry.target as HTMLElement
      const reddit_id = element.dataset.redditId
      if (entry.isIntersecting) {
        if (!this.seen_ids.has(reddit_id)) {
          this.seen_ids.add(reddit_id)
          if (element.dataset.loadMore === "true") {
            this.load_more()
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
}