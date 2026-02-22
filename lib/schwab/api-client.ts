import type { SchwabOrder } from "@/types/schwab"
import { getMockSchwabOrders } from "./mock-data"

const SCHWAB_API_BASE = "https://api.schwabapi.com/trader/v1"

/**
 * Fetches filled orders from the Schwab API for a given account.
 *
 * When SCHWAB_CLIENT_ID is not set, returns mock data for development.
 * When set, calls the real Schwab Trader API.
 */
export async function fetchSchwabOrders(
  token: string | null,
  accountId: string,
  fromDate: Date,
  toDate: Date
): Promise<SchwabOrder[]> {
  // Mock mode: return generated data when no API credentials are configured
  if (!process.env.SCHWAB_CLIENT_ID) {
    console.log("[Schwab] No SCHWAB_CLIENT_ID set — using mock data")
    const allOrders = getMockSchwabOrders()

    // Filter mock orders to the requested date range
    return allOrders.filter((order) => {
      const orderDate = new Date(order.enteredTime)
      return orderDate >= fromDate && orderDate <= toDate
    })
  }

  // Real mode: call Schwab API
  if (!token) {
    throw new Error("Schwab API token is required")
  }

  const params = new URLSearchParams({
    fromEnteredTime: fromDate.toISOString(),
    toEnteredTime: toDate.toISOString(),
    status: "FILLED",
    maxResults: "3000",
  })

  const url = `${SCHWAB_API_BASE}/accounts/${accountId}/orders?${params}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Schwab API error ${response.status}: ${errorText}`
    )
  }

  const orders: SchwabOrder[] = await response.json()
  return orders
}
