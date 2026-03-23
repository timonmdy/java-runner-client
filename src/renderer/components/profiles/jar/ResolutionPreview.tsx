import React from 'react';
import { VscCheck, VscWarning, VscSync } from 'react-icons/vsc';
import type { JarResolutionResult } from '../../../../main/shared/types/JarResolution.types';

interface Props {
  result: JarResolutionResult | null;
  loading: boolean;
}

export function ResolutionPreview({ result, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-border bg-base-950 text-xs font-mono text-text-muted animate-fade-in">
        <VscSync size={11} className="animate-spin shrink-0" />
        Resolving...
      </div>
    );
  }

  if (!result) return null;

  if (!result.ok) {
    return (
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 text-xs font-mono text-red-400 animate-fade-in">
        <VscWarning size={11} className="shrink-0 mt-px" />
        {result.error ?? 'No match found'}
      </div>
    );
  }

  const filename = result.resolvedPath?.split(/[/\\]/).pop() ?? '';
  const otherCount = (result.candidates?.length ?? 1) - 1;

  return (
    <div className="space-y-1.5 animate-fade-in">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/20 bg-accent/5 text-xs font-mono">
        <VscCheck size={11} className="text-accent shrink-0" />
        <span className="text-accent font-medium truncate flex-1" title={result.resolvedPath}>
          {filename}
        </span>
        {otherCount > 0 && (
          <span className="text-text-muted shrink-0">+{otherCount} other{otherCount !== 1 ? 's' : ''}</span>
        )}
      </div>
      {result.candidates && result.candidates.length > 1 && (
        <div className="px-3 py-2 rounded-lg border border-surface-border bg-base-950 space-y-0.5 max-h-28 overflow-y-auto">
          {result.candidates.map((c) => (
            <p
              key={c}
              className={[
                'text-xs font-mono truncate',
                c === filename ? 'text-accent' : 'text-text-muted',
              ].join(' ')}
            >
              {c === filename ? '> ' : '  '}
              {c}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
