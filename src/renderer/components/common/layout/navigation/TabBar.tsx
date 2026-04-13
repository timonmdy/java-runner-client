import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VscChevronLeft, VscChevronRight } from 'react-icons/vsc';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  Icon?: React.ElementType;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  accentColor?: string;
  className?: string;
  dotTab?: string;
  /** Content rendered after the tabs, pushed to the right edge */
  trailing?: React.ReactNode;
}

export function TabBar({
  tabs,
  active,
  onChange,
  accentColor = 'var(--tw-theme-accent, #4ade80)',
  className = '',
  dotTab,
  trailing,
}: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateOverflow();
    const ro = new ResizeObserver(updateOverflow);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateOverflow, tabs.length]);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 120, behavior: 'smooth' });
  };

  return (
    <div
      className={[
        'relative flex items-center border-b border-surface-border bg-base-900 shrink-0',
        className,
      ].join(' ')}
    >
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 z-10 h-full px-1 bg-gradient-to-r from-base-900 via-base-900/90 to-transparent text-text-muted hover:text-text-primary transition-colors"
        >
          <VscChevronLeft size={14} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateOverflow}
        className="flex items-center px-4 overflow-x-auto scrollbar-none"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors duration-150 shrink-0',
                isActive ? '' : 'text-text-muted border-transparent hover:text-text-primary',
              ].join(' ')}
              style={isActive ? { borderBottomColor: accentColor, color: accentColor } : {}}
            >
              {tab.icon}
              {tab.Icon && <tab.Icon size={13} />}
              {tab.label}
              {tab.badge}
              {dotTab === tab.id && (
                <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-console-warn align-middle" />
              )}
            </button>
          );
        })}
      </div>

      {trailing && <div className="flex items-center shrink-0 ml-auto pr-4">{trailing}</div>}

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 z-10 h-full px-1 bg-gradient-to-l from-base-900 via-base-900/90 to-transparent text-text-muted hover:text-text-primary transition-colors"
        >
          <VscChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
