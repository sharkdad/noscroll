export const SORT_METHODS: SortBy[] = [
  { name: "curated", label: "Curated", has_time_filter: false },
  { name: "hot", label: "Hot", has_time_filter: false },
  { name: "top", label: "Top", has_time_filter: true },
  { name: "rising", label: "Rising", has_time_filter: false },
  { name: "new", label: "New", has_time_filter: false },
  { name: "controversial", label: "Controversial", has_time_filter: true },
]

export const TIME_FILTERS: TimeFilter[] = [
  { name: "all", label: "All time" },
  { name: "year", label: "This year" },
  { name: "month", label: "This month" },
  { name: "day", label: "Today" },
  { name: "hour", label: "Now" },
]

export interface SortBy {
  name: string
  label: string
  has_time_filter: boolean
}

export interface TimeFilter {
  name: string
  label: string
}

export interface LocationFeed {
  page_path: string
  feed_id: string
}

export interface AppDetails {
  is_authenticated: boolean
  reddit_users: string[]
  feeds: LocationFeed[]
}

export interface AppGlobals {
  app_details: AppDetails
}

export interface Location {
  page_path: string
  display_name: string
}

export interface Locations {
  locations: Location[]
}

export interface LoadId {
  reddit_user?: string
  page_path: string
  feed_id?: string
  sort_method: SortBy
  time_filter: TimeFilter
  search: string
}
