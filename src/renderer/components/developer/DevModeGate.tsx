import { useEffect, useState } from 'react';
import { VscCode } from 'react-icons/vsc';
import { useDevMode } from '../../hooks/useDevMode';
import { Button } from '../common/inputs';

export function DevModeGate() {
  const devEnabled = useDevMode();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const keysPressed = new Set<string>();
    const keydownHandler = (e: KeyboardEvent) => {
      keysPressed.add(e.code);
      if (keysPressed.has('ShiftRight') && keysPressed.has('Digit7')) {
        e.preventDefault();
        setDialogOpen(true);
      }
    };
    const keyupHandler = (e: KeyboardEvent) => keysPressed.delete(e.code);
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    return () => {
      window.removeEventListener('keydown', keydownHandler);
      window.removeEventListener('keyup', keyupHandler);
    };
  }, []);

  if (!dialogOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div className="bg-base-900 border border-surface-border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <VscCode size={16} className="text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Developer Mode</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {devEnabled ? 'Currently enabled' : 'Currently disabled'}
            </p>
          </div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          {devEnabled
            ? 'Disable developer mode? This will hide the Developer panel and close DevTools.'
            : 'Enable developer mode? This will show the Developer panel and enable DevTools for this session.'}
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              jrc.env.toggleDevMode(!devEnabled);
              setDialogOpen(false);
            }}
          >
            {devEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </div>
  );
}
