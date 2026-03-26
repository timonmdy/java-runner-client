import React from 'react';
import type { SidebarTopic } from '../../../main/shared/types/Sidebar.types';

export type { SidebarTopic };

interface Props {
  topics: SidebarTopic[];
  activeTopicId: string;
  onTopicChange: (id: string) => void;
  children: React.ReactNode;
  sidebarWidth?: string;
}

export function SidebarLayout({
  topics,
  activeTopicId,
  onTopicChange,
  children,
  sidebarWidth = 'w-36',
}: Props) {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      <div
        className={`${sidebarWidth} shrink-0 border-r border-surface-border bg-base-900/60 overflow-y-auto py-2`}
      >
        {topics.map((topic) => (
          <SidebarButton
            key={topic.id}
            label={topic.label}
            active={activeTopicId === topic.id}
            onClick={() => onTopicChange(topic.id)}
          />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
    </div>
  );
}

function SidebarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
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
      {label}
    </button>
  );
}
