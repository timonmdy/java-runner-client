import React, { useEffect, useMemo, useState } from 'react';
import type { FaqItem } from '../../../main/shared/config/faq/_index';
import { SidebarLayout } from '../layout/SidebarLayout';
import { FaqTopic, getFAQ } from '../../../main/shared/config/faq/_index';

export function FaqPanel() {
  const [faqTopics, setFaqTopics] = useState<FaqTopic[] | null>(null);
  const [search, setSearch] = useState('');
  const [activeTopic, setActiveTopic] = useState<string>('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const searchTrimmed = search.trim().toLowerCase();

  useEffect(() => {
    window.api.getLanguageState().then((s) => {
      const topics = getFAQ(s.activeLanguageId);
      setFaqTopics(topics);
      if (topics.length > 0) setActiveTopic(topics[0].id);
    });
  }, []);

  const searchResults = useMemo<FaqItem[]>(() => {
    if (!searchTrimmed) return [];
    return (
      faqTopics
        ?.flatMap((t) => t.items)
        .filter(
          (item) =>
            item.q.toLowerCase().includes(searchTrimmed) ||
            item.a.toLowerCase().includes(searchTrimmed)
        ) ?? []
    );
  }, [searchTrimmed, faqTopics]);

  const activeTopic_ = faqTopics?.find((t) => t.id === activeTopic) ?? faqTopics?.[0];
  const displayItems = searchTrimmed ? searchResults : (activeTopic_?.items ?? []);

  const handleTopicChange = (id: string) => {
    setActiveTopic(id);
    setExpandedIdx(null);
    setSearch('');
  };

  if (!faqTopics) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-surface-border bg-base-900 shrink-0">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setExpandedIdx(null);
          }}
          placeholder="Search FAQ..."
          className="w-full bg-base-950 border border-surface-border rounded-md px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors font-mono"
        />
      </div>

      {searchTrimmed ? (
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 space-y-2">
          <FaqList
            items={displayItems}
            expandedIdx={expandedIdx}
            onToggle={(i) => setExpandedIdx(expandedIdx === i ? null : i)}
            emptyLabel="No results found."
          />
        </div>
      ) : (
        <SidebarLayout
          topics={faqTopics}
          activeTopicId={activeTopic}
          onTopicChange={handleTopicChange}
        >
          <div className="px-4 py-3 space-y-2">
            <FaqList
              items={displayItems}
              expandedIdx={expandedIdx}
              onToggle={(i) => setExpandedIdx(expandedIdx === i ? null : i)}
              emptyLabel="No items in this topic."
            />
          </div>
        </SidebarLayout>
      )}
    </div>
  );
}

function FaqList({
  items,
  expandedIdx,
  onToggle,
  emptyLabel,
}: {
  items: FaqItem[];
  expandedIdx: number | null;
  onToggle: (i: number) => void;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-text-muted font-mono py-8 text-center">{emptyLabel}</p>;
  }
  return (
    <>
      {items.map((item, i) => (
        <FaqEntry key={i} item={item} open={expandedIdx === i} onToggle={() => onToggle(i)} />
      ))}
    </>
  );
}

function FaqEntry({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
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
  );
}
