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

interface CommentNotificationEmailProps {
  postTitle: string;
  postUrl: string;
  commentAuthor: string;
  commentContent: string;
  commentDate: string;
  recipientName: string;
  unsubscribeUrl?: string;
  language?: string;
}

const CommentNotificationEmail = ({
  postTitle,
  postUrl,
  commentAuthor,
  commentContent,
  commentDate,
  recipientName,
  unsubscribeUrl = 'https://shikuf.app/settings/notifications',
  language = 'en'
}: CommentNotificationEmailProps) => {
  const i18n = {
    preview: 'New comment on your Shikuf post',
    greeting: 'Hello',
    notification: 'Great news! Someone just commented on your post on Shikuf.',
    article: 'Post',
    viewComment: 'View comment',
    footer: {
      text: 'Shikuf - Advanced Analytics for Modern Traders',
      help: 'Need help? Contact',
      community: 'support',
      unsubscribe: 'Unsubscribe from comment notifications'
    }
  }

  return (
    <Html>
      <Head />
      <Preview>{i18n.preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Section className="bg-white max-w-[600px] mx-auto rounded-lg shadow-xs">
            <Section className="px-6 py-8">
              <Heading className="text-2xl font-bold text-gray-900 mb-6">
                {i18n.greeting} {recipientName},
              </Heading>
              
              <Text className="text-gray-800 mb-6 leading-6">
                {i18n.notification}
              </Text>

              <Section className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Text className="text-gray-800 font-medium mb-2">
                  {i18n.article} : {postTitle}
                </Text>
                
                <Section className="bg-white p-4 rounded-lg border border-gray-200">
                  <Text className="text-gray-700 mb-1 font-medium">
                    {commentAuthor} <span className="text-gray-500 font-normal text-sm">• {commentDate}</span>
                  </Text>
                  <Text className="text-gray-800 mb-0 leading-6">
                    &ldquo;{commentContent}&rdquo;
                  </Text>
                </Section>
              </Section>

              <Section className="text-center mb-8">
                <Button 
                  className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-md font-medium box-border border-2 border-blue-600"
                  href={postUrl}
                >
                  {i18n.viewComment} →
                </Button>
              </Section>

              <Hr className="border-gray-200 my-8" />

              <Text className="text-gray-400 text-xs text-center m-0">
                {i18n.footer.text}
              </Text>
              <Text className="text-gray-400 text-xs text-center m-0">
                {i18n.footer.help}{' '}
                <Link href="#" className="text-gray-400 underline">
                  {i18n.footer.community}
                </Link>
                {' • '}
                <Link href={unsubscribeUrl} className="text-gray-400 underline">
                  {i18n.footer.unsubscribe}
                </Link>
              </Text>
            </Section>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CommentNotificationEmail;