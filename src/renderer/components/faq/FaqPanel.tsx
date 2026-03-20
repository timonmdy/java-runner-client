import React, { useState, useMemo } from 'react'
import { FAQ_TOPICS } from '../../../main/shared/config/FAQ.config'
import type { FaqItem, FaqTopic } from '../../../main/shared/config/FAQ.config'

export function FaqPanel() {
  const [search, setSearch] = useState('')
  const [activeTopic, setActiveTopic] = useState<string>(FAQ_TOPICS[0]?.id ?? '')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const searchTrimmed = search.trim().toLowerCase()

  const searchResults = useMemo<FaqItem[]>(() => {
    if (!searchTrimmed) return []
    return FAQ_TOPICS.flatMap((t) => t.items).filter(
      (item) =>
        item.q.toLowerCase().includes(searchTrimmed) || item.a.toLowerCase().includes(searchTrimmed)
    )
  }, [searchTrimmed])

  const activeTopic_ = FAQ_TOPICS.find((t) => t.id === activeTopic) ?? FAQ_TOPICS[0]
  const displayItems = searchTrimmed ? searchResults : (activeTopic_?.items ?? [])

  const handleTopicClick = (id: string) => {
    setActiveTopic(id)
    setExpandedIdx(null)
    setSearch('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border bg-base-900 shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setExpandedIdx(null)
          }}
          placeholder="Search FAQ..."
          className="w-full bg-base-950 border border-surface-border rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors font-mono"
        />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {!searchTrimmed && (
          <div className="w-36 shrink-0 border-r border-surface-border bg-base-900/60 overflow-y-auto py-2">
            {FAQ_TOPICS.map((topic) => (
              <TopicButton
                key={topic.id}
                topic={topic}
                active={activeTopic === topic.id}
                onClick={() => handleTopicClick(topic.id)}
              />
            ))}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {displayItems.length === 0 && (
            <p className="text-xs text-text-muted font-mono py-8 text-center">
              {searchTrimmed ? 'No results found.' : 'No items in this topic.'}
            </p>
          )}
          {displayItems.map((item, i) => (
            <FaqEntry
              key={i}
              item={item}
              open={expandedIdx === i}
              onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function TopicButton({
  topic,
  active,
  onClick,
}: {
  topic: FaqTopic
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 text-xs transition-colors',
        active
          ? 'text-text-primary bg-surface-raised font-medium border-r-2 border-accent'
          : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50',
      ].join(' ')}
    >
      {topic.label}
    </button>
  )
}

function FaqEntry({
  item,
  open,
  onToggle,
}: {
  item: FaqItem
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={[
        'rounded-lg border transition-colors overflow-hidden',
        open ? 'border-surface-border bg-base-900' : 'border-surface-border bg-base-900/50',
      ].join(' ')}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-medium text-text-primary leading-relaxed">{item.q}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={[
            'shrink-0 mt-0.5 text-text-muted transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t border-surface-border">
          <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap pt-2.5">
            {item.a}
          </p>
        </div>
      )}
    </div>
  )
}
