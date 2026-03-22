import { useState, useEffect } from 'react';
import { JRCEnvironment } from 'src/main/shared/types/App.types';

export function useDevMode(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    // fetch initial value
    window.env.get().then((value) => {
      if (mounted) setEnabled(value.devMode);
    });

    // subscribe to changes
    const handler = (value: JRCEnvironment) => {
      if (mounted) setEnabled(value.devMode);
    };
    window.env.onChange(handler);

    return () => {
      mounted = false;
    };
  }, []);

  return enabled;
}
