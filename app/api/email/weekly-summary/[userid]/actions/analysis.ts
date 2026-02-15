'use server'

import { openai } from "@ai-sdk/openai"
import { streamObject } from "ai"
import { z } from 'zod/v3';

const SHIKUF_CONTEXT = {
  en: `Shikuf is a web platform for day traders, featuring an intuitive and customizable interface. It offers features like multiple account management, customizable dashboards, and in-depth analysis of trading habits to optimize strategies and improve decision-making.`
}

const analysisSchema = z.object({
  intro: z.string().describe("A very short analysis (1 sentence) of the week's performance"),
  tips: z.string().describe("Concise tips (about 18 words) to improve next week's performance")
})

interface AnalysisResult {
  resultAnalysisIntro: string
  tipsForNextWeek: string
}

interface DailyPnL {
  date: Date
  pnl: number
}

export async function generateTradingAnalysis(
  dailyPnL: DailyPnL[],
  language: 'fr' | 'en'
): Promise<AnalysisResult> {
  const defaultAnalysis = {
    resultAnalysisIntro: "Here are your trading statistics for the week.",
    tipsForNextWeek: "Continue applying your strategy with discipline and analyzing your trades to improve."
  }

  try {
    // Sort trades by date
    const sortedTrades = [...dailyPnL].sort((a, b) => a.date.getTime() - b.date.getTime())
    
    // Group trades by week
    const tradesByWeek = sortedTrades.reduce((acc, trade) => {
      const weekNumber = getWeekNumber(trade.date)
      if (!acc[weekNumber]) {
        acc[weekNumber] = []
      }
      acc[weekNumber].push(trade)
      return acc
    }, {} as Record<number, DailyPnL[]>)

    // Get the two most recent weeks
    const weekNumbers = Object.keys(tradesByWeek).map(Number).sort((a, b) => b - a)
    const lastTwoWeeks = weekNumbers.slice(0, 2).map(weekNum => tradesByWeek[weekNum])

    const { partialObjectStream } = streamObject({
      model: openai("gpt-4.1-nano-2025-04-14"),
      schema: analysisSchema,
      prompt: `You are a trading coach who helps traders improve. You are always positive and encouraging.
${SHIKUF_CONTEXT.en}

Here are the trading results for the last two weeks:

Daily performance data:
${lastTwoWeeks.map((week, index) => {
  const isCurrentWeek = index === 0;
  const weekLabel = isCurrentWeek ? 'Current Week' : 'Previous Week';
  return `${weekLabel}:\n${week.map(day => 
    `- ${day.date.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'long' })}: ${day.pnl}€`
  ).join('\n')}`
}).join('\n\n')}

For the analysis (intro):
1. Write a simple sentence explaining how the current week went
2. Always find something positive to say, even if it's small
3. Speak like you're talking to a friend, using simple words
4. You can use up to 60 words
5. Look at how the results change each day
6. Say what's working well and what can be better, but always kindly
7. Compare with the previous week if possible
8. Take into account the day of the week for analysis
9. Focus on the current week, using the previous week as a reference point

For the tips:
1. Give a simple and easy-to-follow tip
2. You can use up to 36 words
3. Talk about a Shikuf tool that can help
4. Explain how this tip can help do better
5. Be specific about what to do
6. Look at the good and not-so-good days to give useful advice
7. Say things in a positive way, like a chance to improve
8. Use simple and clear words
9. Take into account trends over the two weeks
10. Focus on possible improvements for the upcoming week

Write an analysis that helps the trader improve:`,
      temperature: 0.7,
    })

    const content = { intro: "", tips: "" }
    for await (const partialObject of partialObjectStream) {
      if (partialObject.intro) content.intro = partialObject.intro
      if (partialObject.tips) content.tips = partialObject.tips
    }

    if (content.intro && content.tips) {
      return {
        resultAnalysisIntro: content.intro,
        tipsForNextWeek: content.tips
      }
    }

    return defaultAnalysis
  } catch (error) {
    console.error('Error generating analysis:', error)
    return defaultAnalysis
  }
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}
