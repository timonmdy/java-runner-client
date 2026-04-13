import { ProfileTemplate } from '@shared/types/GitHub.types';
import React, { useEffect, useState } from 'react';
import { LuShield } from 'react-icons/lu';
import { VscAdd, VscPackage, VscRefresh, VscTag } from 'react-icons/vsc';
import { useApp } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/inputs';
import { Modal } from '../common/overlays';

const APP_TEMPLATE_VERSION = 1;

interface TemplateEntry {
  filename: string;
  template: ProfileTemplate;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

function isCompatible(t: ProfileTemplate): boolean {
  return t.templateVersion <= APP_TEMPLATE_VERSION;
}

export function TemplateModal({ open, onClose }: Props) {
  const { createProfile } = useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateEntry[] | null>(null);
  const [selected, setSelected] = useState<TemplateEntry | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await jrc.api.fetchTemplates();
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Failed to load templates');
      return;
    }
    setTemplates(res.data);
  };

  useEffect(() => {
    if (open && templates === null) load();
  }, [open]);

  const handleCreate = () => {
    if (!selected) return;
    const tpl = selected.template;
    createProfile({
      name: tpl.name,
      jvmArgs: tpl.defaults.jvmArgs,
      systemProperties: tpl.defaults.systemProperties,
      programArgs: tpl.defaults.programArgs,
      javaPath: tpl.defaults.javaPath,
      autoStart: tpl.defaults.autoStart,
      autoRestart: tpl.defaults.autoRestart,
      autoRestartInterval: tpl.defaults.autoRestartInterval,
      color: tpl.defaults.color,
    });
    onClose();
  };

  const filtered =
    templates?.filter(
      (e) =>
        filter === '' ||
        e.template.name.toLowerCase().includes(filter.toLowerCase()) ||
        e.template.category.toLowerCase().includes(filter.toLowerCase()) ||
        e.template.tags.some((tag) => tag.toLowerCase().includes(filter.toLowerCase()))
    ) ?? [];

  const grouped = filtered.reduce<Record<string, TemplateEntry[]>>((acc, e) => {
    const cat = e.template.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(e);
    return acc;
  }, {});

  return (
    <Modal open={open} onClose={onClose} title={t('template.title')} width="lg">
      <div className="flex flex-col" style={{ height: 480 }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border shrink-0">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t('template.searchPlaceholder')}
            className="flex-1 bg-base-950 border border-surface-border rounded-md px-3 py-1.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-colors"
          />
          <button
            onClick={load}
            disabled={loading}
            className="text-text-muted hover:text-accent transition-colors disabled:opacity-40 p-1"
          >
            <VscRefresh size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-52 shrink-0 border-r border-surface-border overflow-y-auto py-2">
            {loading && !templates && (
              <p className="text-xs text-text-muted font-mono px-4 py-6 text-center">
                {t('general.loading')}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-400 font-mono px-4 py-6 text-center leading-relaxed">
                {error}
              </p>
            )}
            {templates && filtered.length === 0 && (
              <p className="text-xs text-text-muted font-mono px-4 py-6 text-center">
                {t('template.noTemplates')}
              </p>
            )}
            {Object.entries(grouped).map(([cat, entries]) => (
              <div key={cat}>
                <p className="px-3 py-1.5 text-xs font-mono text-text-muted uppercase tracking-widest">
                  {cat}
                </p>
                {entries.map((entry) => {
                  const compat = isCompatible(entry.template);
                  return (
                    <button
                      key={entry.filename}
                      disabled={!compat}
                      onClick={() => setSelected(entry)}
                      className={[
                        'w-full text-left px-3 py-2 text-xs transition-colors',
                        !compat
                          ? 'opacity-40 cursor-not-allowed text-text-muted'
                          : selected?.filename === entry.filename
                            ? 'bg-surface-raised text-text-primary border-r-2 border-accent'
                            : 'text-text-secondary hover:bg-surface-raised/50 hover:text-text-primary',
                      ].join(' ')}
                    >
                      {entry.template.name}
                      {!compat && (
                        <span className="ml-1 text-[10px] text-red-400">
                          v{entry.template.templateVersion}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {!selected ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
                <VscPackage size={28} />
                <p className="text-xs font-mono text-center">{t('template.selectHint')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {selected.template.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    {selected.template.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-raised border border-surface-border text-text-muted"
                      >
                        <VscTag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="border-t border-surface-border" />
                <TplSection title={t('template.jvmArgs')}>
                  {selected.template.defaults.jvmArgs.length === 0 ? (
                    <TplEmpty />
                  ) : (
                    selected.template.defaults.jvmArgs.map((a, i) => (
                      <TplPill key={i} value={a.value} enabled={a.enabled} />
                    ))
                  )}
                </TplSection>
                <TplSection title={t('template.systemProperties')}>
                  {selected.template.defaults.systemProperties.length === 0 ? (
                    <TplEmpty />
                  ) : (
                    selected.template.defaults.systemProperties.map((p, i) => (
                      <TplPill
                        key={i}
                        value={`-D${p.key}${p.value ? `=${p.value}` : ''}`}
                        enabled={p.enabled}
                      />
                    ))
                  )}
                </TplSection>
                <TplSection title={t('template.programArgs')}>
                  {selected.template.defaults.programArgs.length === 0 ? (
                    <TplEmpty />
                  ) : (
                    selected.template.defaults.programArgs.map((a, i) => (
                      <TplPill key={i} value={a.value} enabled={a.enabled} />
                    ))
                  )}
                </TplSection>
                <div className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
                  <LuShield size={11} />
                  {t('template.versionInfo', {
                    version: String(selected.template.templateVersion),
                    appVersion: selected.template.minAppVersion,
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-surface-border shrink-0">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('general.cancel')}
          </Button>
          <Button variant="primary" size="sm" disabled={!selected} onClick={handleCreate}>
            <VscAdd size={11} /> {t('template.createProfile')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TplSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function TplPill({ value, enabled }: { value: string; enabled: boolean }) {
  return (
    <span
      className={[
        'px-2 py-0.5 rounded font-mono text-xs border',
        enabled
          ? 'bg-base-950 border-surface-border text-text-secondary'
          : 'bg-base-950 border-surface-border text-text-muted opacity-50 line-through',
      ].join(' ')}
    >
      {value}
    </span>
  );
}

function TplEmpty() {
  const { t } = useTranslation();
  return <span className="text-xs text-text-muted font-mono italic">{t('general.none')}</span>;
}
