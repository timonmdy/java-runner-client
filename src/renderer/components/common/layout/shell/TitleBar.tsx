import React from 'react';
import { VscChromeClose, VscChromeMinimize } from 'react-icons/vsc';
import { useApp } from '../../../../AppProvider';
import { StatusDot } from '../../display/StatusDot';

export function TitleBar() {
  const { state } = useApp();
  const runningCount = state.processStates.filter((s) => s.running).length;

  return (
    <div
      className="flex items-center justify-between h-10 px-3 bg-base-950 border-b border-surface-border select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          className="text-accent shrink-0"
        >
          <path
            d="M9 3C9 3 8 8 12 10C16 12 16 16 16 16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M7 17C7 17 8 15 12 15C16 15 17 17 17 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="20" r="1.5" fill="currentColor" />
          <path
            d="M6 12C6 12 4 10 4 8C4 6 5.5 5 7 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
        <span className="text-xs font-mono text-text-secondary tracking-widest uppercase truncate min-w-0">
          Java Runner Client
        </span>
        {runningCount > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-accent/15 border border-accent/30 animate-fade-in">
            <StatusDot pulse />
            <span className="text-accent text-xs font-mono font-medium leading-none">
              {runningCount}
            </span>
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => jrc.api.minimizeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
          title="Minimize"
        >
          <VscChromeMinimize size={12} />
        </button>
        <button
          onClick={() => jrc.api.closeWindow()}
          className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Close"
        >
          <VscChromeClose size={12} />
        </button>
      </div>
    </div>
  );
}
