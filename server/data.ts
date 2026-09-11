import type { Firm, Review } from '../src/types.js'

export const firms: Firm[] = [
  { id: 'fundednext', name: 'FundedNext', initials: 'FN', score: 9.4, reviews: 4821, payout: '4h avg.', price: 299, accountSize: '$100K', profitSplit: '95%', maxDrawdown: '10%', trust: 'Verified', color: '#c8ff31', tags: ['Fast payout', 'Best overall'] },
  { id: 'fundingpips', name: 'FundingPips', initials: 'FP', score: 9.1, reviews: 3642, payout: '8h avg.', price: 259, accountSize: '$100K', profitSplit: '90%', maxDrawdown: '10%', trust: 'Verified', color: '#8b7cff', tags: ['Low fee', 'Popular'] },
  { id: 'the5ers', name: 'The5ers', initials: '5%', score: 8.9, reviews: 2917, payout: '18h avg.', price: 385, accountSize: '$100K', profitSplit: '100%', maxDrawdown: '6%', trust: 'Verified', color: '#40e0d0', tags: ['Scaling', 'Established'] },
  { id: 'alpha-capital', name: 'Alpha Capital', initials: 'AC', score: 8.7, reviews: 1894, payout: '12h avg.', price: 297, accountSize: '$100K', profitSplit: '80%', maxDrawdown: '10%', trust: 'Verified', color: '#ffb347', tags: ['Great platform', 'UK based'] },
  { id: 'e8-markets', name: 'E8 Markets', initials: 'E8', score: 8.4, reviews: 1266, payout: '24h avg.', price: 228, accountSize: '$100K', profitSplit: '80%', maxDrawdown: '8%', trust: 'Watchlist', color: '#ff6577', tags: ['Flexible', 'New rules'] },
]

export const reviews: Review[] = [
  { id: 'r1', author: 'Arjun Mehta', firm: 'FundedNext', rating: 5, text: 'Payout landed in under five hours. Rules were exactly as listed and support actually knew what they were doing.', createdAt: '2 hours ago', verified: true },
  { id: 'r2', author: 'Maya Singh', firm: 'FundingPips', rating: 5, text: 'Clean dashboard and no surprises during verification. RMP comparison saved me from choosing the wrong account type.', createdAt: '5 hours ago', verified: true },
  { id: 'r3', author: 'Rohit K.', firm: 'The5ers', rating: 4, text: 'Slower start, but the scaling plan is excellent for a patient swing trader. First payout received.', createdAt: 'Yesterday', verified: true },
]
