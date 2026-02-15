import * as React from 'react';
import {
  Body,
  Button,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
  email?: string;
  youtubeId: string;
}

export default function WelcomeEmail({ firstName = 'trader', email, youtubeId }: WelcomeEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const thumbnailUrl = `${baseUrl}/api/email/thumbnail/${youtubeId}/maxresdefault`;
  const unsubscribeUrl = email
    ? `https://shikuf.app/api/email/unsubscribe?email=${encodeURIComponent(email)}`
    : '#';

  return (
      <Html>
      <Head />
      <Preview>Welcome to Shikuf - Your trading tracking platform</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Section className="bg-white max-w-[600px] mx-auto rounded-lg shadow-xs">
            <Section className="px-6 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-6">
                Hello {firstName},
              </Heading>
              
              <Text className="text-gray-800 mb-4 leading-6">
                Welcome to Shikuf!
              </Text>

              <Text className="text-gray-800 mb-4 leading-6">
                The goal of the platform is to help you follow and analyze your trading performance in a simple and efficient way.
              </Text>

              <Text className="text-gray-800 mb-6 leading-6">
                I hope you have had the chance to explore the interface.
              </Text>

              <Section className="mb-8">
                <Link href={`https://youtu.be/${youtubeId}`}>
                  <Img
                    src={thumbnailUrl}
                    alt="Latest Shikuf video"
                    className="rounded-lg w-full mb-4 shadow-xs"
                  />
                </Link>
                <Button
                  className="bg-black text-white text-sm px-4 py-2 rounded-md font-medium box-border"
                  href={`https://youtu.be/${youtubeId}`}
                >
                  ▶️ Watch the latest video
                </Button>
              </Section>

              <Text className="text-gray-800 mb-4 leading-6">
                If you have any questions or need help getting started, please let me know, I&apos;d be happy to help.
              </Text>

              <Text className="text-gray-800 mb-6 leading-6">
                Happy trading and see you soon!
              </Text>

              <Section className="text-center">
                <Button 
                  className="bg-black text-white text-sm px-6 py-2.5 rounded-md font-medium box-border"
                  href="https://shikuf.app/dashboard"
                >
                  Access my dashboard →
                </Button>
              </Section>

              <Hr className="border-gray-200 my-8" />

              <Text className="text-gray-400 text-xs text-center">
                This email was sent by Shikuf
                {' • '}
                <Link href={unsubscribeUrl} className="text-gray-400 underline">
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Section>
        </Body>
      </Tailwind>
    </Html>
    );
}