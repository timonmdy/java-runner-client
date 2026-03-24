import React from 'react';
import { Input } from '../../common/Input';
import { FolderBtn } from './FolderBtn';
import { ResolutionPreview } from './ResolutionPreview';
import { useJarResolutionPreview } from '../../../hooks/useJarResolutionPreview';
import { JAR_RESOLUTION_STRATEGIES } from '../../../../main/shared/config/JarResolution.config';
import type { JarResolutionConfig } from '../../../../main/shared/types/JarResolution.types';

interface Props {
  config: JarResolutionConfig;
  onChange: (patch: Partial<JarResolutionConfig>) => void;
  onPickDir: () => void;
}

export function DynamicJarConfig({ config, onChange, onPickDir }: Props) {
  const { result, loading } = useJarResolutionPreview(config, true);

  return (
    <div className="space-y-4 animate-fade-in">
      <Input
        label="Base Directory"
        value={config.baseDir}
        onChange={(e) => onChange({ baseDir: e.target.value })}
        placeholder="Directory containing your JARs"
        hint="Folder to scan for matching JAR files"
        rightElement={<FolderBtn onClick={onPickDir} />}
      />

      <div className="space-y-1">
        <label className="block text-xs font-mono text-text-muted uppercase tracking-widest">
          Strategy
        </label>
        <div className="flex flex-col gap-1">
          {JAR_RESOLUTION_STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ strategy: s.id })}
              className={[
                'flex items-start gap-3 px-3 py-2 rounded-lg border text-left transition-colors',
                config.strategy === s.id
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-surface-border bg-base-900/50 hover:border-surface-border/80',
              ].join(' ')}
            >
              <span
                className={[
                  'mt-0.5 w-3 h-3 rounded-full border-2 shrink-0 transition-colors',
                  config.strategy === s.id
                    ? 'border-accent bg-accent'
                    : 'border-surface-border bg-transparent',
                ].join(' ')}
              />
              <span className="flex-1 min-w-0">
                <span
                  className={[
                    'block text-xs font-mono',
                    config.strategy === s.id ? 'text-accent' : 'text-text-primary',
                  ].join(' ')}
                >
                  {s.label}
                </span>
                <span className="block text-xs text-text-muted mt-0.5 leading-relaxed">
                  {s.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {config.strategy !== 'regex' && (
        <Input
          label="Filename Pattern"
          value={config.pattern}
          onChange={(e) => onChange({ pattern: e.target.value })}
          placeholder="app-{version}.jar"
          hint='Use {version} as a placeholder — e.g. "myapp-{version}.jar"'
        />
      )}

      {config.strategy === 'regex' && (
        <Input
          label="Regular Expression"
          value={config.regexOverride ?? ''}
          onChange={(e) => onChange({ regexOverride: e.target.value })}
          placeholder="myapp-\d+\.\d+\.jar"
          hint="Matched against filenames in the base directory (case-insensitive)"
        />
      )}

      <ResolutionPreview result={result} loading={loading} />
    </div>
  );
}
