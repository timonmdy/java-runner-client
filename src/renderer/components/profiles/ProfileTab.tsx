import React, { useState, useEffect } from 'react';
import { useApp, PROFILE_COLORS } from '../../AppProvider';
import { useTranslation } from '../../i18n/I18nProvider';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Dialog } from '../common/Dialog';
import { Profile } from '../../../main/shared/types/Profile.types';

export function ProfileTab() {
  const { activeProfile, saveProfile, deleteProfile } = useApp();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (activeProfile) setDraft({ ...activeProfile });
  }, [activeProfile?.id]);

  if (!draft || !activeProfile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-text-muted">
        {t('general.noProfileSelected')}
      </div>
    );
  }

  const update = (patch: Partial<Profile>) =>
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  const color = draft.color || PROFILE_COLORS[0];
  const isCustomColor = !PROFILE_COLORS.includes(draft.color);

  const handleSave = async () => {
    await saveProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-base-900 shrink-0">
          <h2 className="text-sm font-medium text-text-primary flex-1">{t('profile.identity')}</h2>
          <Button
            variant="custom"
            size="sm"
            onClick={handleSave}
            style={{ backgroundColor: color, color: '#08090d', borderColor: color }}
          >
            {saved ? t('general.saved') : t('general.save')}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-5 space-y-6">
          <Section title={t('profile.name')}>
            <Input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="My Server"
            />
          </Section>

          <Section title={t('profile.accentColour')} hint={t('profile.accentColourHint')}>
            <div className="flex flex-wrap items-center gap-2.5">
              {PROFILE_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => update({ color: c })}
                  className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none"
                  style={{
                    backgroundColor: c,
                    boxShadow: draft.color === c ? `0 0 0 2px #08090d, 0 0 0 4px ${c}` : 'none',
                    transform: draft.color === c ? 'scale(1.15)' : undefined,
                  }}
                />
              ))}
              <label
                className="w-7 h-7 rounded-full transition-all duration-150 hover:scale-110 cursor-pointer overflow-hidden border-2 border-dashed border-surface-border relative"
                style={{
                  backgroundColor: isCustomColor ? draft.color : 'transparent',
                  boxShadow: isCustomColor ? `0 0 0 2px #08090d, 0 0 0 4px ${draft.color}` : 'none',
                  transform: isCustomColor ? 'scale(1.15)' : undefined,
                }}
                title={t('profile.customColour')}
              >
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => update({ color: e.target.value })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                {!isCustomColor && (
                  <span className="absolute inset-0 flex items-center justify-center text-text-muted text-[10px] font-bold">
                    +
                  </span>
                )}
              </label>
            </div>
          </Section>

          <Section title={t('profile.dangerZone')}>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-text-primary">
                  {t('profile.deleteProfile')}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{t('profile.deleteHint')}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  if ((e as React.MouseEvent).shiftKey) {
                    deleteProfile(draft.id);
                  } else {
                    setShowDelete(true);
                  }
                }}
                className="shrink-0"
              >
                {t('general.delete')}
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <Dialog
        open={showDelete}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMessage', { name: draft.name })}
        confirmLabel={t('general.delete')}
        danger
        onConfirm={async () => {
          await deleteProfile(draft.id);
          setShowDelete(false);
        }}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-widest">{title}</h3>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
