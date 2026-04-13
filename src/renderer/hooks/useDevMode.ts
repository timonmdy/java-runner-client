import { JRCEnvironment } from '@shared/types/App.types';
import { useEffect, useState } from 'react';

export function useDevMode(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    jrc.env.get().then((value) => {
      if (mounted) setEnabled(value.devMode);
    });

    const handler = (value: JRCEnvironment) => {
      if (mounted) setEnabled(value.devMode);
    };
    jrc.env.onChange(handler);

    return () => {
      mounted = false;
    };
  }, []);

  return enabled;
}
