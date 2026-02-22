/**
 * Technical indicator computation for trade analytics.
 *
 * In mock mode: generates realistic indicator values derived from the entry price.
 * In production: will fetch real OHLCV candle data from a market data API
 * and compute actual EMA/VWAP values.
 */

export interface TechnicalIndicators {
  ema9: number
  ema20: number
  ema200: number
  vwap: number
}

/**
 * Computes Exponential Moving Average for a price series.
 * Returns the full EMA array (same length as input).
 */
export function computeEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return []
  if (period <= 0) throw new Error("EMA period must be positive")

  const multiplier = 2 / (period + 1)
  const ema: number[] = new Array(prices.length)

  // Start with SMA for the first `period` values
  let sum = 0
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i]
    ema[i] = sum / (i + 1)
  }

  // EMA for the rest
  for (let i = period; i < prices.length; i++) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
  }

  return ema
}

/**
 * Computes Volume Weighted Average Price from OHLCV candle data.
 * VWAP = sum(typical_price * volume) / sum(volume)
 * where typical_price = (high + low + close) / 3
 */
export function computeVWAP(
  candles: { high: number; low: number; close: number; volume: number }[]
): number {
  if (candles.length === 0) return 0

  let cumulativeTPV = 0
  let cumulativeVolume = 0

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    cumulativeTPV += typicalPrice * candle.volume
    cumulativeVolume += candle.volume
  }

  return cumulativeVolume === 0 ? 0 : cumulativeTPV / cumulativeVolume
}

// Seeded RNG for reproducible mock indicators
function mockRng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/**
 * Generates realistic mock technical indicators based on the entry price.
 *
 * - EMA9: very close to price (short-term, tight tracking)
 * - EMA20: slightly further from price
 * - EMA200: notably offset (represents long-term trend)
 * - VWAP: near the price, slight bias toward daily mean
 *
 * Uses a deterministic seed derived from the symbol + entry date
 * so the same trade always produces the same indicators.
 */
export function getMockIndicators(
  entryPrice: number,
  symbol: string,
  entryDate: string
): TechnicalIndicators {
  // Create a deterministic seed from symbol + date
  let seed = 0
  const key = `${symbol}|${entryDate}`
  for (let i = 0; i < key.length; i++) {
    seed = (seed * 31 + key.charCodeAt(i)) & 0xffffffff
  }
  const rng = mockRng(seed)

  const round = (n: number) => Math.round(n * 100) / 100

  // EMA9: within 0.5% of price
  const ema9 = round(entryPrice * (1 + (rng() - 0.5) * 0.01))

  // EMA20: within 1.5% of price
  const ema20 = round(entryPrice * (1 + (rng() - 0.5) * 0.03))

  // EMA200: within 5% of price, with a slight upward trend bias
  const ema200 = round(entryPrice * (1 + (rng() - 0.4) * 0.1))

  // VWAP: within 0.8% of price
  const vwap = round(entryPrice * (1 + (rng() - 0.5) * 0.016))

  return { ema9, ema20, ema200, vwap }
}

/**
 * Gets technical indicators for a trade entry.
 *
 * Currently uses mock data. When a market data API is configured,
 * this will fetch real OHLCV candles and compute actual indicators.
 */
export async function getIndicatorsAtEntry(
  symbol: string,
  entryDate: Date,
  entryPrice: number
): Promise<TechnicalIndicators> {
  // TODO: When SCHWAB_CLIENT_ID is set, fetch real candle data:
  // 1. Fetch daily candles for the symbol (at least 200 days before entryDate)
  // 2. Compute EMA 9/20/200 from closing prices
  // 3. Fetch intraday candles for the entry day to compute VWAP
  // For now, return mock indicators
  return getMockIndicators(entryPrice, symbol, entryDate.toISOString())
}
