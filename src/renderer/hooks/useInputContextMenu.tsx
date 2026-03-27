import React, { useCallback, useState } from 'react';
import { MdContentCopy, MdContentCut, MdContentPaste, MdSelectAll } from 'react-icons/md';
import { ContextMenu } from '../components/common/ContextMenu';
import { useTranslation } from '../i18n/I18nProvider';

type InputEl = HTMLInputElement | HTMLTextAreaElement;

interface State {
  x: number;
  y: number;
  el: InputEl;
  hasSelection: boolean;
}

// Module-level: only one input context menu can be open at a time across all instances
let closeActiveMenu: (() => void) | null = null;

export function useInputContextMenu() {
  const { t } = useTranslation();
  const [state, setState] = useState<State | null>(null);

  const onContextMenu = useCallback((e: React.MouseEvent<InputEl>) => {
    e.preventDefault();
    closeActiveMenu?.();
    const el = e.currentTarget;
    setState({
      x: e.clientX,
      y: e.clientY,
      el,
      hasSelection: (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0),
    });
    closeActiveMenu = () => setState(null);
  }, []);

  const handleClose = useCallback(() => {
    setState(null);
    closeActiveMenu = null;
  }, []);

  const contextMenu = state ? (
    <ContextMenu
      x={state.x}
      y={state.y}
      onClose={handleClose}
      items={[
        {
          label: t('general.cut'),
          icon: <MdContentCut size={12} />,
          disabled: !state.hasSelection,
          onClick: () => {
            state.el.focus();
            document.execCommand('cut');
          },
        },
        {
          label: t('general.copy'),
          icon: <MdContentCopy size={12} />,
          disabled: !state.hasSelection,
          onClick: () => {
            state.el.focus();
            document.execCommand('copy');
          },
        },
        {
          label: t('general.paste'),
          icon: <MdContentPaste size={12} />,
          onClick: () => {
            state.el.focus();
            document.execCommand('paste');
          },
        },
        { type: 'separator' as const },
        {
          icon: <MdSelectAll size={12} />,
          label: t('general.selectAll'),
          onClick: () => {
            state.el.focus();
            state.el.select();
          },
        },
      ]}
    />
  ) : null;

  return { onContextMenu, contextMenu } as const;
}
