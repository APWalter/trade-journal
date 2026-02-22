import type { SchwabOrder, SchwabInstruction } from "@/types/schwab"
import type { Trade } from "@/prisma/generated/prisma/client"

type PartialTrade = Omit<Trade, "createdAt">

interface OrderFill {
  orderId: number
  instruction: SchwabInstruction
  symbol: string
  quantity: number
  price: number
  time: string // ISO datetime
}

/**
 * Extracts fill information from a Schwab order.
 * Uses execution legs for actual fill price/time when available,
 * falls back to order-level price/enteredTime.
 */
function extractFill(order: SchwabOrder): OrderFill | null {
  if (order.status !== "FILLED") return null

  const leg = order.orderLegCollection[0]
  if (!leg) return null

  // Prefer execution leg data (actual fill) over order-level data
  const execLeg = order.orderActivityCollection?.[0]?.executionLegs?.[0]

  return {
    orderId: order.orderId,
    instruction: leg.instruction,
    symbol: leg.instrument.symbol,
    quantity: execLeg?.quantity ?? order.filledQuantity ?? leg.quantity,
    price: execLeg?.price ?? order.price ?? 0,
    time: execLeg?.time ?? order.closeTime ?? order.enteredTime,
  }
}

/**
 * Returns true if the instruction opens a position.
 */
function isOpeningInstruction(instruction: SchwabInstruction): boolean {
  return instruction === "BUY" || instruction === "SELL_SHORT"
}

/**
 * Returns true if the instruction closes a position.
 */
function isClosingInstruction(instruction: SchwabInstruction): boolean {
  return instruction === "SELL" || instruction === "BUY_TO_COVER"
}

/**
 * Determines the trade side from the opening instruction.
 */
function getSide(instruction: SchwabInstruction): string {
  return instruction === "BUY" ? "long" : "short"
}

/**
 * Converts an array of Schwab filled orders into round-trip Trade objects.
 *
 * Logic:
 * 1. Filter to FILLED orders only
 * 2. Group fills by symbol
 * 3. Match opening/closing fills chronologically (FIFO)
 * 4. Compute PnL, time in position, and other Trade fields
 *
 * Handles partial fills by matching the minimum quantity between
 * opening and closing fills, and carrying forward remainders.
 */
export function convertSchwabOrdersToTrades(
  orders: SchwabOrder[],
  accountNumber: string,
  userId: string
): PartialTrade[] {
  // Extract and sort fills by time
  const fills = orders
    .map(extractFill)
    .filter((f): f is OrderFill => f !== null)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  // Group fills by symbol
  const bySymbol = new Map<string, OrderFill[]>()
  for (const fill of fills) {
    const existing = bySymbol.get(fill.symbol) ?? []
    existing.push(fill)
    bySymbol.set(fill.symbol, existing)
  }

  const trades: PartialTrade[] = []

  for (const [symbol, symbolFills] of bySymbol) {
    // Separate into opening and closing queues (FIFO)
    const openQueue: OrderFill[] = []
    const closeQueue: OrderFill[] = []

    for (const fill of symbolFills) {
      if (isOpeningInstruction(fill.instruction)) {
        openQueue.push({ ...fill })
      } else if (isClosingInstruction(fill.instruction)) {
        closeQueue.push({ ...fill })
      }
    }

    // Match opening fills with closing fills (FIFO)
    let oi = 0
    let ci = 0

    while (oi < openQueue.length && ci < closeQueue.length) {
      const open = openQueue[oi]
      const close = closeQueue[ci]

      // Ensure close is after open
      if (new Date(close.time) <= new Date(open.time)) {
        ci++
        continue
      }

      // Match the minimum quantity
      const matchQty = Math.min(open.quantity, close.quantity)
      if (matchQty <= 0) {
        oi++
        continue
      }

      const side = getSide(open.instruction)
      const direction = side === "long" ? 1 : -1
      const pnl = (close.price - open.price) * matchQty * direction
      const entryTime = new Date(open.time)
      const exitTime = new Date(close.time)
      const timeInPosition = (exitTime.getTime() - entryTime.getTime()) / 1000

      const trade: PartialTrade = {
        id: "", // Will be set by generateTradeUUID in saveTradesAction
        accountNumber,
        userId,
        instrument: symbol,
        quantity: matchQty,
        entryPrice: open.price.toString(),
        closePrice: close.price.toString(),
        entryDate: entryTime.toISOString(),
        closeDate: exitTime.toISOString(),
        entryId: open.orderId.toString(),
        closeId: close.orderId.toString(),
        side,
        pnl: Math.round(pnl * 100) / 100,
        commission: 0, // Schwab: $0 commission on equities
        timeInPosition,
        comment: null,
        tags: [],
        imageBase64: null,
        videoUrl: null,
        imageBase64Second: null,
        groupId: "",
        images: [],
      }

      trades.push(trade)

      // Reduce remaining quantities
      open.quantity -= matchQty
      close.quantity -= matchQty

      if (open.quantity <= 0) oi++
      if (close.quantity <= 0) ci++
    }
  }

  // Sort trades by entry date
  trades.sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  )

  return trades
}
