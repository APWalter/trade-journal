import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserId } from "@/server/auth"
import { fetchSchwabOrders } from "@/lib/schwab/api-client"
import { convertSchwabOrdersToTrades } from "@/lib/schwab/convert-orders"
import { getIndicatorsAtEntry } from "@/lib/schwab/technical-indicators"
import { saveTradesAction } from "@/server/database"
import type { Trade } from "@/prisma/generated/prisma/client"

export async function POST(request: Request) {
  try {
    const userId = await getUserId()
    const { accountId } = await request.json()

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: "accountId is required" },
        { status: 400 }
      )
    }

    // Find or create synchronization record
    let sync = await prisma.synchronization.findUnique({
      where: {
        userId_service_accountId: {
          userId,
          service: "schwab",
          accountId,
        },
      },
    })

    if (!sync) {
      // Create a new sync record (first sync — fetch last 60 days)
      sync = await prisma.synchronization.create({
        data: {
          userId,
          service: "schwab",
          accountId,
          lastSyncedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Fetch orders from Schwab API (or mock data)
    const fromDate = new Date(sync.lastSyncedAt)
    const toDate = new Date()

    const orders = await fetchSchwabOrders(
      sync.token,
      accountId,
      fromDate,
      toDate
    )

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new orders found",
        savedCount: 0,
        ordersCount: 0,
      })
    }

    // Convert Schwab orders to Trade format
    const trades = convertSchwabOrdersToTrades(orders, accountId, userId)

    if (trades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No complete round-trip trades found in orders",
        savedCount: 0,
        ordersCount: orders.length,
      })
    }

    // Save trades
    const result = await saveTradesAction(trades as Trade[], { userId })

    if (result.error === "DUPLICATE_TRADES") {
      return NextResponse.json({
        success: true,
        message: "DUPLICATE_TRADES",
        savedCount: 0,
        ordersCount: orders.length,
      })
    }

    // Compute and save technical indicators for new trades
    if (result.numberOfTradesAdded > 0) {
      const indicatorPromises = trades.map(async (trade) => {
        try {
          const indicators = await getIndicatorsAtEntry(
            trade.instrument,
            new Date(trade.entryDate),
            parseFloat(trade.entryPrice)
          )

          await prisma.tradeAnalytics.upsert({
            where: { tradeId: trade.id },
            create: {
              tradeId: trade.id,
              ema9: indicators.ema9,
              ema20: indicators.ema20,
              ema200: indicators.ema200,
              vwap: indicators.vwap,
              dataSource: "SCHWAB",
            },
            update: {
              ema9: indicators.ema9,
              ema20: indicators.ema20,
              ema200: indicators.ema200,
              vwap: indicators.vwap,
            },
          })
        } catch (err) {
          console.error(
            `[Schwab Sync] Failed to compute indicators for trade ${trade.id}:`,
            err
          )
        }
      })

      await Promise.allSettled(indicatorPromises)
    }

    // Update last synced time
    await prisma.synchronization.update({
      where: { id: sync.id },
      data: { lastSyncedAt: toDate },
    })

    return NextResponse.json({
      success: true,
      savedCount: result.numberOfTradesAdded,
      ordersCount: orders.length,
    })
  } catch (error) {
    console.error("[Schwab Sync] Error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 }
    )
  }
}
