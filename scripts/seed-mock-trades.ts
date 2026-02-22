/**
 * Seed script: populates the database with mock Schwab trades and analytics.
 *
 * Usage:
 *   npx tsx scripts/seed-mock-trades.ts
 *
 * Prerequisites:
 *   - .env.local must have valid DATABASE_URL
 *   - Prisma client must be generated (npx prisma generate)
 *   - Database must be in sync (npx prisma db push)
 */

import dotenv from "dotenv"
dotenv.config({ path: ".env.local", override: true })

import { PrismaClient } from "../prisma/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { getMockSchwabOrders, MOCK_ACCOUNT } from "../lib/schwab/mock-data"
import { convertSchwabOrdersToTrades } from "../lib/schwab/convert-orders"
import { getMockIndicators } from "../lib/schwab/technical-indicators"
import { v5 as uuidv5 } from "uuid"

const TRADE_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

function generateTradeUUID(trade: Record<string, any>): string {
  const sig = [
    trade.userId || "",
    trade.accountNumber || "",
    trade.instrument || "",
    trade.entryDate || "",
    trade.closeDate || "",
    trade.entryPrice || "",
    trade.closePrice || "",
    (trade.quantity || 0).toString(),
    trade.entryId || "",
    trade.closeId || "",
    (trade.timeInPosition || 0).toString(),
    trade.side || "",
    (trade.pnl || 0).toString(),
    (trade.commission || 0).toString(),
  ].join("|")
  return uuidv5(sig, TRADE_NAMESPACE)
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // Find the first user in the database
    const user = await prisma.user.findFirst()
    if (!user) {
      console.error("No user found in database. Please sign in first.")
      process.exit(1)
    }

    console.log(`Using user: ${user.email} (${user.id})`)

    // Generate mock orders and convert to trades
    const orders = getMockSchwabOrders()
    console.log(`Generated ${orders.length} mock Schwab orders`)

    const trades = convertSchwabOrdersToTrades(orders, MOCK_ACCOUNT, user.id)
    console.log(`Converted to ${trades.length} round-trip trades`)

    // Assign deterministic IDs
    for (const trade of trades) {
      trade.id = generateTradeUUID(trade)
    }

    // Save trades (skip duplicates)
    const result = await prisma.trade.createMany({
      data: trades.map((t) => ({
        ...t,
        createdAt: new Date(),
      })),
      skipDuplicates: true,
    })

    console.log(`Saved ${result.count} new trades (${trades.length - result.count} duplicates skipped)`)

    // Compute and save technical indicators
    let analyticsCount = 0
    for (const trade of trades) {
      const indicators = getMockIndicators(
        parseFloat(trade.entryPrice),
        trade.instrument,
        trade.entryDate
      )

      await prisma.tradeAnalytics.upsert({
        where: { tradeId: trade.id },
        create: {
          tradeId: trade.id,
          ema9: indicators.ema9,
          ema20: indicators.ema20,
          ema200: indicators.ema200,
          vwap: indicators.vwap,
          dataSource: "SCHWAB_MOCK",
        },
        update: {
          ema9: indicators.ema9,
          ema20: indicators.ema20,
          ema200: indicators.ema200,
          vwap: indicators.vwap,
        },
      })
      analyticsCount++
    }

    console.log(`Saved ${analyticsCount} trade analytics records`)

    // Create or update synchronization record
    await prisma.synchronization.upsert({
      where: {
        userId_service_accountId: {
          userId: user.id,
          service: "schwab",
          accountId: MOCK_ACCOUNT,
        },
      },
      create: {
        userId: user.id,
        service: "schwab",
        accountId: MOCK_ACCOUNT,
        lastSyncedAt: new Date(),
      },
      update: {
        lastSyncedAt: new Date(),
      },
    })

    console.log(`Created/updated synchronization record for account ${MOCK_ACCOUNT}`)

    // Summary
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
    const winners = trades.filter((t) => t.pnl > 0).length
    const losers = trades.filter((t) => t.pnl < 0).length
    const instruments = new Set(trades.map((t) => t.instrument))

    console.log("\n--- Summary ---")
    console.log(`Total trades: ${trades.length}`)
    console.log(`Winners: ${winners} | Losers: ${losers} | Win rate: ${((winners / trades.length) * 100).toFixed(1)}%`)
    console.log(`Total PnL: $${totalPnl.toFixed(2)}`)
    console.log(`Instruments: ${[...instruments].join(", ")}`)
    console.log(`Account: ${MOCK_ACCOUNT}`)
  } catch (error) {
    console.error("Seed failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
