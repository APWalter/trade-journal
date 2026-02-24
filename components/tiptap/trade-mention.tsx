'use client'

import { Mention } from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react'
import { format } from 'date-fns'
import type { Trade } from '@/prisma/generated/prisma/browser'
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'

// Format a trade for display as a mention label
function formatTrade(trade: Trade) {
  const side = trade.side?.toLowerCase() === 'long' ? 'Long' : 'Short'
  const date = format(new Date(trade.entryDate), 'M/d')
  const pnl = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`
  return `${trade.instrument} ${side} ${date} ${pnl}`
}

// The suggestion dropdown component
interface MentionListProps {
  items: Trade[]
  command: (attrs: { id: string; label: string }) => void
}

interface MentionListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command({
            id: item.id,
            label: formatTrade(item),
          })
        }
      },
      [items, command],
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-popover border rounded-lg shadow-md p-2 text-sm text-muted-foreground">
          No trades found
        </div>
      )
    }

    return (
      <div className="bg-popover border rounded-lg shadow-md overflow-hidden max-h-64 overflow-y-auto min-w-[280px]">
        {items.map((item, index) => {
          const side = item.side?.toLowerCase() === 'long' ? 'Long' : 'Short'
          const isProfit = item.pnl >= 0
          return (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
              onClick={() => selectItem(index)}
            >
              <span className="font-medium">{item.instrument}</span>
              <span className="text-muted-foreground">{side}</span>
              <span className="text-muted-foreground text-xs">
                {format(new Date(item.entryDate), 'M/d')}
              </span>
              <span
                className={`ml-auto font-mono text-xs ${
                  isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {isProfit ? '+' : '-'}${Math.abs(item.pnl).toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>
    )
  },
)

MentionList.displayName = 'MentionList'

// Create the mention extension using a getter function so trades stay current
// even after the editor is created (trades may load asynchronously)
export function createTradeMentionExtension(getTradesRef: () => Trade[]) {
  return Mention.configure({
    HTMLAttributes: {
      class: 'trade-mention',
    },
    renderText({ node }) {
      return `@${node.attrs.label ?? node.attrs.id}`
    },
    renderHTML({ node, HTMLAttributes }) {
      return [
        'span',
        { ...HTMLAttributes, 'data-trade-id': node.attrs.id },
        `${node.attrs.label ?? node.attrs.id}`,
      ]
    },
    suggestion: {
      char: '@',
      items: ({ query }: { query: string }) => {
        const trades = getTradesRef()
        const q = query.toLowerCase()
        return trades
          .filter((trade) => {
            const label = formatTrade(trade).toLowerCase()
            const instrument = trade.instrument.toLowerCase()
            return instrument.includes(q) || label.includes(q)
          })
          .slice(0, 10)
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | null = null
        let popup: HTMLDivElement | null = null

        return {
          onStart: (props: SuggestionProps) => {
            component = new ReactRenderer(MentionList, {
              props,
              editor: props.editor,
            })

            popup = document.createElement('div')
            popup.style.position = 'absolute'
            popup.style.zIndex = '9999'
            document.body.appendChild(popup)
            popup.appendChild(component.element)

            if (props.clientRect) {
              const rect = (props.clientRect as () => DOMRect)()
              if (rect) {
                popup.style.left = `${rect.left}px`
                popup.style.top = `${rect.bottom + 4}px`
              }
            }
          },
          onUpdate: (props: SuggestionProps) => {
            component?.updateProps(props)

            if (popup && props.clientRect) {
              const rect = (props.clientRect as () => DOMRect)()
              if (rect) {
                popup.style.left = `${rect.left}px`
                popup.style.top = `${rect.bottom + 4}px`
              }
            }
          },
          onKeyDown: (props: SuggestionKeyDownProps) => {
            if (props.event.key === 'Escape') {
              popup?.remove()
              return true
            }
            return component?.ref?.onKeyDown(props) ?? false
          },
          onExit: () => {
            popup?.remove()
            component?.destroy()
          },
        }
      },
    },
  })
}
