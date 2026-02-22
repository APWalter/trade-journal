import type { SchwabOrder } from "@/types/schwab"

// Realistic price ranges for each ticker (approximate as of late 2025/early 2026)
const TICKER_PRICES: Record<string, { base: number; volatility: number }> = {
  AAPL: { base: 230, volatility: 0.03 },
  TSLA: { base: 350, volatility: 0.06 },
  NVDA: { base: 140, volatility: 0.05 },
  MSFT: { base: 430, volatility: 0.025 },
  AMD: { base: 160, volatility: 0.05 },
  META: { base: 580, volatility: 0.035 },
  GOOG: { base: 175, volatility: 0.03 },
  AMZN: { base: 200, volatility: 0.035 },
  SPY: { base: 590, volatility: 0.015 },
  QQQ: { base: 510, volatility: 0.02 },
  NFLX: { base: 900, volatility: 0.04 },
  DIS: { base: 110, volatility: 0.035 },
  BA: { base: 180, volatility: 0.04 },
  JPM: { base: 240, volatility: 0.025 },
  V: { base: 310, volatility: 0.02 },
}

const TICKERS = Object.keys(TICKER_PRICES)
const MOCK_ACCOUNT = "MOCK-SCHWAB-12345678"

// Seeded pseudo-random number generator for reproducible mock data
function createRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function roundToTwo(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Generates 50 realistic mock swing trades as paired BUY/SELL Schwab orders (100 orders total).
 * Uses a seeded RNG for reproducible results.
 */
export function getMockSchwabOrders(): SchwabOrder[] {
  const rng = createRng(42)
  const orders: SchwabOrder[] = []
  let orderId = 100000001

  // Start date: 6 months ago
  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - 6)
  const dateRangeMs = now.getTime() - startDate.getTime()

  for (let i = 0; i < 50; i++) {
    // Pick a random ticker
    const ticker = TICKERS[Math.floor(rng() * TICKERS.length)]
    const { base, volatility } = TICKER_PRICES[ticker]

    // Determine if this is a winning trade (~60% win rate)
    const isWinner = rng() < 0.6

    // Determine side (~85% long, ~15% short)
    const isLong = rng() < 0.85

    // Entry price: base +/- some random drift
    const drift = (rng() - 0.5) * 2 * volatility * base
    const entryPrice = roundToTwo(base + drift)

    // PnL as percentage of entry price
    const pnlPct = isWinner
      ? 0.01 + rng() * 0.08 // winners: +1% to +9%
      : -(0.005 + rng() * 0.04) // losers: -0.5% to -4.5%

    const priceDiff = roundToTwo(entryPrice * pnlPct)
    const exitPrice = roundToTwo(
      isLong ? entryPrice + priceDiff : entryPrice - priceDiff
    )

    // Quantity: 5 to 200 shares (round lots more common)
    const qty =
      rng() < 0.7
        ? Math.floor(rng() * 20) * 10 + 10 // 10-200 in round lots
        : Math.floor(rng() * 45) + 5 // 5-49 odd lots

    // Entry time: random within the 6-month range
    const entryMs = startDate.getTime() + rng() * dateRangeMs * 0.9
    const entryDate = new Date(entryMs)
    // Snap to market hours (9:30 AM - 4:00 PM ET)
    entryDate.setUTCHours(14 + Math.floor(rng() * 6), Math.floor(rng() * 60), 0, 0)
    // Skip weekends
    while (entryDate.getDay() === 0 || entryDate.getDay() === 6) {
      entryDate.setDate(entryDate.getDate() + 1)
    }

    // Swing trade hold period: 1 to 15 trading days
    const holdDays = Math.floor(rng() * 15) + 1
    const exitDate = new Date(entryDate)
    let daysAdded = 0
    while (daysAdded < holdDays) {
      exitDate.setDate(exitDate.getDate() + 1)
      if (exitDate.getDay() !== 0 && exitDate.getDay() !== 6) {
        daysAdded++
      }
    }
    exitDate.setUTCHours(14 + Math.floor(rng() * 6), Math.floor(rng() * 60), 0, 0)

    // Don't generate trades in the future
    if (exitDate > now) continue

    const entryInstruction = isLong ? "BUY" : "SELL_SHORT"
    const exitInstruction = isLong ? "SELL" : "BUY_TO_COVER"

    // Entry order
    const entryOrder: SchwabOrder = {
      session: "NORMAL",
      duration: "DAY",
      orderType: rng() < 0.6 ? "LIMIT" : "MARKET",
      quantity: qty,
      filledQuantity: qty,
      remainingQuantity: 0,
      price: entryPrice,
      orderLegCollection: [
        {
          instrument: {
            assetType: "EQUITY",
            symbol: ticker,
          },
          instruction: entryInstruction,
          quantity: qty,
          positionEffect: "OPENING",
        },
      ],
      orderStrategyType: "SINGLE",
      orderId: orderId++,
      cancelable: false,
      editable: false,
      status: "FILLED",
      enteredTime: entryDate.toISOString(),
      closeTime: entryDate.toISOString(),
      tag: "API_MOCK",
      accountNumber: MOCK_ACCOUNT,
      orderActivityCollection: [
        {
          activityType: "EXECUTION",
          executionType: "FILL",
          quantity: qty,
          orderRemainingQuantity: 0,
          executionLegs: [
            {
              price: entryPrice,
              quantity: qty,
              time: entryDate.toISOString(),
            },
          ],
        },
      ],
    }

    // Exit order
    const exitOrder: SchwabOrder = {
      session: "NORMAL",
      duration: "DAY",
      orderType: rng() < 0.5 ? "LIMIT" : "MARKET",
      quantity: qty,
      filledQuantity: qty,
      remainingQuantity: 0,
      price: exitPrice,
      orderLegCollection: [
        {
          instrument: {
            assetType: "EQUITY",
            symbol: ticker,
          },
          instruction: exitInstruction,
          quantity: qty,
          positionEffect: "CLOSING",
        },
      ],
      orderStrategyType: "SINGLE",
      orderId: orderId++,
      cancelable: false,
      editable: false,
      status: "FILLED",
      enteredTime: exitDate.toISOString(),
      closeTime: exitDate.toISOString(),
      tag: "API_MOCK",
      accountNumber: MOCK_ACCOUNT,
      orderActivityCollection: [
        {
          activityType: "EXECUTION",
          executionType: "FILL",
          quantity: qty,
          orderRemainingQuantity: 0,
          executionLegs: [
            {
              price: exitPrice,
              quantity: qty,
              time: exitDate.toISOString(),
            },
          ],
        },
      ],
    }

    orders.push(entryOrder, exitOrder)
  }

  // Sort all orders by enteredTime
  orders.sort(
    (a, b) => new Date(a.enteredTime).getTime() - new Date(b.enteredTime).getTime()
  )

  return orders
}

export { MOCK_ACCOUNT }
