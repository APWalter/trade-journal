// TypeScript interfaces matching the Charles Schwab Developer API order response schema
// Reference: https://developer.schwab.com — Accounts and Trading API > Orders

export type SchwabOrderStatus =
  | "AWAITING_PARENT_ORDER"
  | "AWAITING_CONDITION"
  | "AWAITING_STOP_CONDITION"
  | "AWAITING_MANUAL_REVIEW"
  | "ACCEPTED"
  | "AWAITING_UR_OUT"
  | "PENDING_ACTIVATION"
  | "QUEUED"
  | "WORKING"
  | "REJECTED"
  | "PENDING_CANCEL"
  | "CANCELED"
  | "PENDING_REPLACE"
  | "REPLACED"
  | "FILLED"
  | "EXPIRED"
  | "NEW"
  | "UNKNOWN"

export type SchwabInstruction =
  | "BUY"
  | "SELL"
  | "BUY_TO_COVER"
  | "SELL_SHORT"

export type SchwabOrderType =
  | "MARKET"
  | "LIMIT"
  | "STOP"
  | "STOP_LIMIT"
  | "TRAILING_STOP"
  | "CABINET"
  | "NON_MARKETABLE"
  | "MARKET_ON_CLOSE"
  | "EXERCISE"
  | "TRAILING_STOP_LIMIT"
  | "NET_DEBIT"
  | "NET_CREDIT"
  | "NET_ZERO"
  | "LIMIT_ON_CLOSE"

export type SchwabSession = "NORMAL" | "AM" | "PM" | "SEAMLESS"
export type SchwabDuration = "DAY" | "GOOD_TILL_CANCEL" | "FILL_OR_KILL" | "IMMEDIATE_OR_CANCEL" | "END_OF_WEEK" | "END_OF_MONTH"
export type SchwabAssetType = "EQUITY" | "OPTION" | "INDEX" | "MUTUAL_FUND" | "CASH_EQUIVALENT" | "FIXED_INCOME" | "CURRENCY" | "COLLECTIVE_INVESTMENT"

export interface SchwabInstrument {
  assetType: SchwabAssetType
  cusip?: string
  symbol: string
  description?: string
  instrumentId?: number
  netChange?: number
}

export interface SchwabOrderLeg {
  orderLegType?: string
  legId?: number
  instrument: SchwabInstrument
  instruction: SchwabInstruction
  positionEffect?: "OPENING" | "CLOSING" | "AUTOMATIC"
  quantity: number
}

export interface SchwabExecutionLeg {
  legId?: number
  price: number
  quantity: number
  mismarkedQuantity?: number
  instrumentId?: number
  time: string // ISO datetime
}

export interface SchwabOrderActivity {
  activityType: "EXECUTION" | "ORDER_ACTION"
  executionType?: "FILL" | "PARTIAL_FILL"
  quantity: number
  orderRemainingQuantity?: number
  executionLegs: SchwabExecutionLeg[]
}

export interface SchwabOrder {
  session: SchwabSession
  duration: SchwabDuration
  orderType: SchwabOrderType
  cancelTime?: string
  complexOrderStrategyType?: string
  quantity: number
  filledQuantity: number
  remainingQuantity?: number
  requestedDestination?: string
  destinationLinkName?: string
  price?: number
  stopPrice?: number
  stopPriceLinkBasis?: string
  stopPriceLinkType?: string
  stopType?: string
  priceLinkBasis?: string
  priceLinkType?: string
  orderLegCollection: SchwabOrderLeg[]
  orderStrategyType?: "SINGLE" | "OCO" | "TRIGGER"
  orderId: number
  cancelable?: boolean
  editable?: boolean
  status: SchwabOrderStatus
  enteredTime: string // ISO datetime
  closeTime?: string  // ISO datetime
  tag?: string
  accountNumber: string
  orderActivityCollection?: SchwabOrderActivity[]
  statusDescription?: string
}
