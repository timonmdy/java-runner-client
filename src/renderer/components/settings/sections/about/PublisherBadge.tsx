import { getPublisherTrust, TrustLevel } from '@shared/config/GitHub.config';
import React from 'react';
import { LuBot } from 'react-icons/lu';
import { VscVerified, VscWarning } from 'react-icons/vsc';

interface Props {
  login: string;
}

const BADGE_STYLES: Record<
  TrustLevel,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  trusted: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    icon: <VscVerified size={10} />,
  },
  automation: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: <LuBot size={10} />,
  },
  unknown: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: <VscWarning size={10} />,
  },
};

export function PublisherBadge({ login }: Props) {
  const { level, label } = getPublisherTrust(login);
  const style = BADGE_STYLES[level];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${style.bg} ${style.border} ${style.text}`}
      title={
        level === 'unknown'
          ? 'This release was published by a GitHub user not in the trusted list. It was still permitted by GitHub repository security.'
          : label
      }
    >
      {style.icon}
      {label}
    </span>
  );
}
