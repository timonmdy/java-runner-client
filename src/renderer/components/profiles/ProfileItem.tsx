import React from 'react';
import { PROFILE_COLORS } from '../../AppProvider';
import { Profile } from '../../../main/shared/types/Profile.types';

interface Props {
  profile: Profile;
  active: boolean;
  running: boolean;
  isDragging: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function ProfileItem({
  profile,
  active,
  running,
  isDragging,
  onClick,
  onContextMenu,
}: Props) {
  const color = profile.color || PROFILE_COLORS[0];
  const jarName = profile.jarResolution?.enabled
    ? '<dynamic jar>'
    : (profile.jarPath?.split(/[/\\]/).pop() ?? '');

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={(e) => {
        if (e.detail !== 0) e.preventDefault();
      }}
      className={[
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
        active ? 'bg-surface-raised' : 'hover:bg-surface-raised/50',
        isDragging ? 'cursor-grabbing opacity-70' : 'cursor-pointer',
      ].join(' ')}
    >
      <span className="relative shrink-0">
        <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {running && (
          <span
            className="absolute inset-0 rounded-full animate-pulse-dot"
            style={{ backgroundColor: color, opacity: 0.5 }}
          />
        )}
      </span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span
          className={[
            'text-xs truncate',
            active ? 'text-text-primary font-medium' : 'text-text-secondary',
          ].join(' ')}
        >
          {profile.name}
        </span>
        {jarName && (
          <span
            className={`text-[10px] text-text-muted font-mono truncate ${profile.jarResolution?.enabled ? 'italic' : ''}`}
          >
            {jarName}
          </span>
        )}
      </span>
      {running && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />}
    </button>
  );
}
