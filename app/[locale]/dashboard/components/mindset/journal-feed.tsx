'use client'

import { useMemo } from 'react'
import { useMoodStore } from '@/store/mood-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { BookOpen } from 'lucide-react'
import type { WidgetSize } from '@/app/[locale]/dashboard/types/dashboard'

interface JournalFeedProps {
  size: WidgetSize
}

const moodEmoji: Record<string, string> = {
  great: '😄',
  good: '🙂',
  neutral: '😐',
  bad: '😟',
  terrible: '😢',
}

export function JournalFeed({ size }: JournalFeedProps) {
  const moods = useMoodStore((state) => state.moods)

  const journalEntries = useMemo(() => {
    return moods
      .filter((m) => m.journalContent && m.journalContent.trim() !== '' && m.journalContent !== '<p></p>')
      .sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime())
  }, [moods])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4" />
          Journal
          {journalEntries.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({journalEntries.length} {journalEntries.length === 1 ? 'entry' : 'entries'})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-4">
          {journalEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No journal entries yet.</p>
              <p className="text-xs mt-1">Write your first entry from the calendar view.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {journalEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg" title={entry.mood}>
                      {moodEmoji[entry.mood] || '📝'}
                    </span>
                    <span className="text-sm font-medium">
                      {format(new Date(entry.day), 'EEEE, MMMM d, yyyy')}
                    </span>
                    {entry.emotionValue !== 50 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Mood: {entry.emotionValue}/100
                      </span>
                    )}
                  </div>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>p]:my-1 [&_.trade-mention]:inline-flex [&_.trade-mention]:items-center [&_.trade-mention]:px-1.5 [&_.trade-mention]:py-0.5 [&_.trade-mention]:rounded [&_.trade-mention]:text-xs [&_.trade-mention]:font-medium [&_.trade-mention]:bg-emerald-100 [&_.trade-mention]:text-emerald-800 [&_.trade-mention]:dark:bg-emerald-900/30 [&_.trade-mention]:dark:text-emerald-300"
                    dangerouslySetInnerHTML={{ __html: entry.journalContent || '' }}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
