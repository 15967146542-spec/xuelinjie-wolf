import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { MarketSortBy, MarketTab, SortOrder } from '@/types'

export interface MarketRouteState {
  q: string
  tab: MarketTab
  sortBy: MarketSortBy
  sortOrder: SortOrder
  code?: string
}

const validTabs: MarketTab[] = ['ALL', 'WATCHLIST', 'GAINERS', 'HIGH_RATING']
const validSortBy: MarketSortBy[] = ['ratio', 'price', 'volume', 'rating']
const validSortOrder: SortOrder[] = ['asc', 'desc']

export function parseMarketRouteState(query: LocationQuery): MarketRouteState {
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const tab = typeof query.tab === 'string' && validTabs.includes(query.tab as MarketTab)
    ? (query.tab as MarketTab)
    : 'ALL'
  const sortBy = typeof query.sortBy === 'string' && validSortBy.includes(query.sortBy as MarketSortBy)
    ? (query.sortBy as MarketSortBy)
    : 'ratio'
  const sortOrder = typeof query.sortOrder === 'string' && validSortOrder.includes(query.sortOrder as SortOrder)
    ? (query.sortOrder as SortOrder)
    : 'desc'
  const code = typeof query.code === 'string' ? query.code : undefined

  return {
    q,
    tab,
    sortBy,
    sortOrder,
    code
  }
}

export function buildMarketRouteQuery(state: Partial<MarketRouteState>): LocationQueryRaw {
  return {
    q: state.q?.trim() || undefined,
    tab: state.tab,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    code: state.code
  }
}

export function extractReturnMarketQuery(query: LocationQuery, fallbackCode?: string): LocationQueryRaw {
  const parsed = parseMarketRouteState(query)
  return buildMarketRouteQuery({
    q: parsed.q,
    tab: parsed.tab,
    sortBy: parsed.sortBy,
    sortOrder: parsed.sortOrder,
    code: parsed.code || fallbackCode
  })
}
