import { JAR_RESOLUTION_STRATEGIES } from '@shared/config/JarResolution.config';
import type { JarResolutionConfig } from '@shared/types/JarResolution.types';
import { useInputContextMenu } from '../../../hooks/useInputContextMenu';
import { useJarResolutionPreview } from '../../../hooks/useJarResolutionPreview';
import { useTranslation } from '../../../i18n/I18nProvider';
import type { TranslationKey } from '../../../i18n/TranslationKeys';
import { Input } from '../../common/Input';
import { FolderBtn } from './FolderBtn';
import { ResolutionPreview } from './ResolutionPreview';

const STRATEGY_KEYS: Record<string, { label: TranslationKey; hint: TranslationKey }> = {
  'highest-version': {
    label: 'config.strategyHighestVersion',
    hint: 'config.strategyHighestVersionHint',
  },
  'latest-modified': {
    label: 'config.strategyLatestModified',
    hint: 'config.strategyLatestModifiedHint',
  },
  regex: { label: 'config.strategyRegex', hint: 'config.strategyRegexHint' },
};

interface Props {
  config: JarResolutionConfig;
  onChange: (patch: Partial<JarResolutionConfig>) => void;
  onPickDir: () => void;
}

export function DynamicJarConfig({ config, onChange, onPickDir }: Props) {
  const { t } = useTranslation();
  const { result, loading } = useJarResolutionPreview(config, true);
  const { onContextMenu, contextMenu } = useInputContextMenu();

  return (
    <div className="space-y-4 animate-fade-in">
      <Input
        label={t('config.baseDir')}
        value={config.baseDir}
        onChange={(e) => onChange({ baseDir: e.target.value })}
        onContextMenu={onContextMenu}
        placeholder={t('config.baseDirPlaceholder')}
        hint={t('config.baseDirHint')}
        rightElement={<FolderBtn onClick={onPickDir} />}
      />

      <div className="space-y-1">
        <label className="block text-xs font-mono text-text-muted uppercase tracking-widest">
          {t('config.strategy')}
        </label>
        <div className="flex flex-col gap-1">
          {JAR_RESOLUTION_STRATEGIES.map((s) => {
            const keys = STRATEGY_KEYS[s.id];
            return (
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
                    {keys ? t(keys.label) : s.label}
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5 leading-relaxed">
                    {keys ? t(keys.hint) : s.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {config.strategy !== 'regex' && (
        <Input
          label={t('config.filenamePattern')}
          value={config.pattern}
          onChange={(e) => onChange({ pattern: e.target.value })}
          onContextMenu={onContextMenu}
          placeholder="app-{version}.jar"
          hint={t('config.filenamePatternHint')}
        />
      )}

      {config.strategy === 'regex' && (
        <Input
          label={t('config.regex')}
          value={config.regexOverride ?? ''}
          onChange={(e) => onChange({ regexOverride: e.target.value })}
          onContextMenu={onContextMenu}
          placeholder="myapp-\d+\.\d+\.jar"
          hint={t('config.regexHint')}
        />
      )}

      <ResolutionPreview result={result} loading={loading} />
      {contextMenu}
    </div>
  );
}
