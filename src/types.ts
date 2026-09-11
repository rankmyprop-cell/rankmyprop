export type Firm = {
  id: string
  name: string
  initials: string
  score: number
  reviews: number
  payout: string
  price: number
  accountSize: string
  profitSplit: string
  maxDrawdown: string
  trust: 'Verified' | 'Watchlist'
  color: string
  tags: string[]
}

export type Review = {
  id: string
  author: string
  firm: string
  rating: number
  text: string
  createdAt: string
  verified: boolean
}
