import React from 'react';
import { StaticJarPicker } from './StaticJarPicker';
import { DynamicJarConfig } from './DynamicJarConfig';
import { DEFAULT_JAR_RESOLUTION } from '../../../../main/shared/config/JarResolution.config';
import type { JarResolutionConfig } from '../../../../main/shared/types/JarResolution.types';

interface Props {
  jarPath: string;
  resolution: JarResolutionConfig | undefined;
  onJarPathChange: (path: string) => void;
  onResolutionChange: (config: JarResolutionConfig) => void;
  onPickJar: () => void;
  onPickDir: () => void;
}

export function JarSelector({
  jarPath,
  resolution,
  onJarPathChange,
  onResolutionChange,
  onPickJar,
  onPickDir,
}: Props) {
  const config = resolution ?? DEFAULT_JAR_RESOLUTION;
  const isDynamic = config.enabled;

  const setDynamic = (enabled: boolean) => {
    onResolutionChange({ ...config, enabled });
  };

  const patchResolution = (patch: Partial<JarResolutionConfig>) => {
    onResolutionChange({ ...config, ...patch });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono text-text-muted uppercase tracking-widest">
          JAR Selection Method
        </label>
        <div className="flex items-center gap-1 bg-base-950 rounded-lg p-0.5 border border-surface-border">
          {(['static', 'dynamic'] as const).map((mode) => {
            const active = mode === 'dynamic' ? isDynamic : !isDynamic;
            return (
              <button
                key={mode}
                onClick={() => setDynamic(mode === 'dynamic')}
                className={[
                  'px-2.5 py-1 text-xs rounded-md transition-colors font-mono',
                  active ? 'bg-surface-raised text-text-primary' : 'text-text-muted hover:text-text-primary',
                ].join(' ')}
              >
                {mode === 'static' ? 'Static' : 'Dynamic'}
              </button>
            );
          })}
        </div>
      </div>

      {isDynamic ? (
        <DynamicJarConfig config={config} onChange={patchResolution} onPickDir={onPickDir} />
      ) : (
        <StaticJarPicker jarPath={jarPath} onChange={onJarPathChange} onPick={onPickJar} />
      )}
    </div>
  );
}
