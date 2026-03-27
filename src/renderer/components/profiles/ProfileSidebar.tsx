import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import {
  VscPlay,
  VscDebugStop,
  VscCheck,
  VscClearAll,
  VscTrash,
  VscSettings,
  VscQuestion,
  VscTools,
  VscAdd,
  VscLayout,
  VscCode,
} from 'react-icons/vsc';
import { useApp, PROFILE_COLORS } from '../../AppProvider';
import { useDevMode } from '../../hooks/useDevMode';
import { useTranslation } from '../../i18n/I18nProvider';
import { Dialog } from '../common/Dialog';
import { ContextMenu, ContextMenuItem } from '../common/ContextMenu';
import { TemplateModal } from './TemplateModal';
import { hasJarConfigured, Profile } from '../../../main/shared/types/Profile.types';

interface Props {
  activeSidePanel: string | null;
}

interface CtxState {
  profileId: string;
  x: number;
  y: number;
}

export function ProfileSidebar({ activeSidePanel }: Props) {
  const navigate = useNavigate();
  const {
    state,
    activeProfile,
    setActiveProfile,
    createProfile,
    deleteProfile,
    startProcess,
    stopProcess,
    clearConsole,
    isRunning,
    reorderProfiles,
  } = useApp();
  const devMode = useDevMode();
  const { t } = useTranslation();

  const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const canDelete = state.profiles.length > 1;

  const handleContextMenu = useCallback((e: React.MouseEvent, profile: Profile) => {
    e.preventDefault();
    setCtxMenu({ profileId: profile.id, x: e.clientX, y: e.clientY });
  }, []);

  const ctxProfile = ctxMenu ? state.profiles.find((p) => p.id === ctxMenu.profileId) : null;
  const ctxRunning = ctxProfile ? isRunning(ctxProfile.id) : false;

  const handleStart = useCallback(
    async (profile: Profile) => {
      if (!hasJarConfigured(profile)) {
        setActionError(`"${profile.name}" ${t('console.noJar')}`);
        return;
      }
      const res = await startProcess(profile);
      if (!res.ok) setActionError(res.error ?? 'Failed to start');
    },
    [startProcess, t]
  );

  const handleStop = useCallback(
    async (profile: Profile) => {
      const res = await stopProcess(profile.id);
      if (!res.ok) setActionError(res.error ?? 'Failed to stop');
    },
    [stopProcess]
  );

  const ctxItems: ContextMenuItem[] = ctxProfile
    ? [
        ctxRunning
          ? {
              label: t('console.stop'),
              icon: <VscDebugStop size={11} />,
              danger: true,
              onClick: () => handleStop(ctxProfile),
            }
          : {
              label: t('console.run'),
              icon: <VscPlay size={11} />,
              disabled: !hasJarConfigured(ctxProfile),
              onClick: () => handleStart(ctxProfile),
            },
        { type: 'separator' },
        {
          label: t('ctx.select'),
          icon: <VscCheck size={12} />,
          onClick: () => {
            setActiveProfile(ctxProfile.id);
            navigate('/console');
          },
        },
        {
          label: t('ctx.clearConsole'),
          icon: <VscClearAll size={12} />,
          onClick: () => clearConsole(ctxProfile.id),
        },
        { type: 'separator' },
        {
          label: t('general.delete'),
          icon: <VscTrash size={12} />,
          danger: true,
          disabled: !canDelete,
          onClick: (e?: React.MouseEvent) => {
            if (!canDelete) return;
            if (e?.shiftKey) deleteProfile(ctxProfile.id);
            else setDeleteTarget(ctxProfile);
          },
        },
      ]
    : [];

  const openPanel = (path: string) => {
    navigate(activeSidePanel === path.slice(1) ? '/console' : path);
  };

  return (
    <>
      <aside className="w-52 shrink-0 flex flex-col bg-base-950 border-r border-surface-border">
        <div className="px-2 pt-2 pb-1 shrink-0">
          <button
            onClick={() => createProfile()}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-text-muted hover:text-accent hover:bg-surface-raised transition-colors border border-dashed border-surface-border hover:border-accent/40"
          >
            <VscAdd size={11} /> {t('sidebar.newProfile')}
          </button>
          <button
            onClick={() => setTemplateOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-text-muted hover:text-text-primary hover:bg-surface-raised/50 transition-colors"
          >
            <VscLayout size={11} /> {t('sidebar.fromTemplate')}
          </button>
        </div>

        <Reorder.Group
          axis="y"
          values={state.profiles}
          onReorder={reorderProfiles}
          className="flex-1 overflow-y-auto py-1 space-y-0.5 px-2 min-h-0"
        >
          {state.profiles.length === 0 && (
            <p className="px-2 py-4 text-xs text-text-muted font-mono text-center">
              {t('sidebar.noProfiles')}
            </p>
          )}
          {state.profiles.map((profile) => (
            <Reorder.Item
              key={profile.id}
              value={profile}
              onDragStart={() => setDraggingId(profile.id)}
              onDragEnd={() => setDraggingId(null)}
              className="list-none"
            >
              <ProfileItem
                profile={profile}
                active={profile.id === activeProfile?.id && activeSidePanel === null}
                running={isRunning(profile.id)}
                isDragging={draggingId === profile.id}
                onClick={() => {
                  setActiveProfile(profile.id);
                  navigate('/console');
                }}
                onContextMenu={(e) => handleContextMenu(e, profile)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="px-2 pt-1 pb-2 border-t border-surface-border space-y-0.5 shrink-0">
          <FooterButton
            label={t('sidebar.utilities')}
            active={activeSidePanel === 'utilities'}
            onClick={() => openPanel('/utilities')}
            icon={<VscTools size={13} />}
          />
          <FooterButton
            label={t('sidebar.faq')}
            active={activeSidePanel === 'faq'}
            onClick={() => openPanel('/faq')}
            icon={<VscQuestion size={13} />}
          />
          <FooterButton
            label={t('sidebar.settings')}
            active={activeSidePanel === 'settings'}
            onClick={() => openPanel('/settings')}
            icon={<VscSettings size={13} />}
          />
          {devMode && (
            <FooterButton
              label={t('sidebar.developer')}
              active={activeSidePanel === 'developer'}
              onClick={() => openPanel('/developer')}
              icon={<VscCode size={13} />}
              accent
            />
          )}
        </div>
      </aside>

      {ctxMenu && ctxItems.length > 0 && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxItems}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />

      <Dialog
        open={!!actionError}
        title={t('ctx.error')}
        message={actionError ?? ''}
        confirmLabel={t('general.close')}
        onConfirm={() => setActionError(null)}
        onCancel={() => setActionError(null)}
      />

      <Dialog
        open={!!deleteTarget}
        title={t('profile.deleteConfirmTitle')}
        message={t('profile.deleteConfirmMessage', { name: deleteTarget?.name ?? '' })}
        confirmLabel={t('general.delete')}
        danger
        onConfirm={async () => {
          if (deleteTarget) await deleteProfile(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileItem({
  profile,
  active,
  running,
  isDragging,
  onClick,
  onContextMenu,
}: {
  profile: Profile;
  active: boolean;
  running: boolean;
  isDragging: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
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

function FooterButton({
  label,
  active,
  onClick,
  icon,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer',
        active
          ? accent
            ? 'bg-accent/10 text-accent'
            : 'bg-surface-raised text-text-primary'
          : accent
            ? 'text-accent/70 hover:text-accent hover:bg-accent/10'
            : 'text-text-muted hover:text-text-primary hover:bg-surface-raised/50',
      ].join(' ')}
    >
      {icon} {label}
    </button>
  );
}
