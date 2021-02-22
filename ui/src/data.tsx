export interface SortBy {
  name: string
  label: string
  has_time_filter: boolean
}

export interface TimeFilter {
  name: string
  label: string
}

export interface Multi {
  owner: string
  name: string
  display_name: string
  feed_id?: string
}

export interface AppDetails {
  is_authenticated: boolean
  reddit_users: string[]
  multis: Multi[]
}

export interface AppState {
  details: AppDetails
  reddit_user: string
  sort_method: SortBy
  time_filter: TimeFilter
}

export interface AppGlobals {
  state: AppState
  sort_methods: SortBy[]
  time_filters: TimeFilter[]
  set_reddit_user: (reddit_user: string) => void
  set_sort_method: (sort_method: SortBy) => void
  set_time_filter: (time_filter: TimeFilter) => void
}

export interface LoadId {
  reddit_user?: string
  subreddit?: string
  multi_owner?: string
  multi_name?: string
  feed_id?: string
  sort_method: SortBy
  time_filter: TimeFilter
  search: string
}

export interface SubmissionLoadingState {
  results: any[]
  is_loading: boolean
}

export interface Embed {
  embed_type: string
  url?: string
  html?: string
  width?: number
  height?: number
}