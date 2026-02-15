import * as React from 'react';
import {
  Body,
  Button,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface MissingYouEmailProps {
  email: string;
  firstName?: string;
  language?: string;
}

const content = {
  en: {
    preview: "We miss seeing you on Shikuf",
    greeting: "Hello",
    notice: "We noticed that you haven't imported your trading data to Shikuf yet.",
    withoutData: "Without your data, we can't provide you with detailed analyses and personalized insights that could transform your trading approach.",
    dailyPerformance: "Your Daily Performance",
    winLoss: "Win/Loss Distribution",
    wins: "Wins",
    losses: "Losses",
    winRate: "Win Rate",
    could: "With Shikuf, you could:",
    features: [
      "Visualize your daily performance",
      "Analyze your win/loss ratio",
      "Receive personalized advice to improve your results",
      "Identify your strengths and areas for improvement"
    ],
    startToday: "Start today by importing your data and discover how Shikuf can transform your trading approach.",
    importButton: "Import my data",
    founder: "Shikuf team",
    footer: "This email was sent by Shikuf",
    unsubscribe: "Unsubscribe",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  },
};

export default function MissingYouEmail({
  email = "user@example.com",
  firstName = "trader",
  language = "en",
}: MissingYouEmailProps) {
  const t = content.en;
  const unsubscribeUrl = email
    ? `https://shikuf.app/api/email/unsubscribe?email=${encodeURIComponent(email)}`
    : '#';

  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Section className="bg-white max-w-[600px] mx-auto rounded-lg shadow-xs">
            <Section className="px-6 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-6">
                {t.greeting} {firstName},
              </Heading>

              <Text className="text-gray-800 mb-6 leading-6">
                {t.notice}
              </Text>

              <Text className="text-gray-800 mb-6 leading-6">
                {t.withoutData}
              </Text>

              {/* Empty Calendar View to show what they're missing */}
              <Section className="mb-8">
                <Heading className="text-xl font-semibold text-gray-900 mb-4">
                  {t.dailyPerformance}
                </Heading>
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <tr className="bg-gray-50">
                    {t.days.map((day) => (
                      <td key={day} className="w-1/5 p-2 text-center text-sm text-gray-600 border border-gray-200">
                        {day}
                      </td>
                    ))}
                  </tr>
                  {[0, 1].map((weekIndex) => (
                    <tr key={weekIndex}>
                      {[0, 1, 2, 3, 4].map((dayIndex) => (
                        <td key={dayIndex} className="w-1/5 p-2 text-center border border-gray-200 min-w-[80px]">
                          <div className="flex items-center justify-center min-h-[48px]">
                            <Text className="text-xs text-gray-400">-</Text>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </table>
              </Section>

              {/* Empty Win/Loss Distribution */}
              <Section className="mb-8 text-center">
                <Heading className="text-xl font-semibold text-gray-900 mb-4">
                  {t.winLoss}
                </Heading>
                <Section className="bg-gray-50 rounded-lg p-4 mb-4">
                  <table className="w-full">
                    <tr>
                      <td className="w-1/2 text-center">
                        <Text className="text-2xl font-bold text-gray-400 mb-2">
                          ?
                        </Text>
                        <Text className="text-sm text-gray-600">{t.wins}</Text>
                      </td>
                      <td className="w-1/2 text-center">
                        <Text className="text-2xl font-bold text-gray-400 mb-2">
                          ?
                        </Text>
                        <Text className="text-sm text-gray-600">{t.losses}</Text>
                      </td>
                    </tr>
                  </table>
                  <Text className="text-lg font-semibold mt-4 text-gray-400">
                    {t.winRate}: ?%
                  </Text>
                </Section>
              </Section>

              <Text className="text-gray-800 mb-6 leading-6">
                {t.could}
              </Text>

              <ul className="list-disc pl-6 mb-6">
                {t.features.map((feature, index) => (
                  <li key={index} className="text-gray-800 mb-2">
                    <Text className="text-gray-800">
                      {feature}
                    </Text>
                  </li>
                ))}
              </ul>

              <Text className="text-gray-800 mb-6 leading-6">
                {t.startToday}
              </Text>

              <Section className="text-center mb-8">
                <Button
                  className="bg-[#3b82f6] text-white text-sm px-[24px] py-[10px] rounded-[4px] font-medium box-border"
                  href="https://shikuf.app/authentication"
                >
                  {t.importButton}
                </Button>
              </Section>

              <Text className="text-gray-800 mt-8 mb-4">
                Shikuf team
              </Text>

              <Hr className="border-gray-200 my-8" />

              <Text className="text-gray-400 text-xs text-center">
                {t.footer}
                <br />
                {' • '}
                <Link href={unsubscribeUrl} className="text-gray-400 underline">
                  {t.unsubscribe}
                </Link>
                {' • '}
                © {new Date().getFullYear()} Shikuf
              </Text>
            </Section>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
}

