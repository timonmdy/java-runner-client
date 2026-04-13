import type { JarResolutionConfig, JarResolutionResult } from '@shared/types/Profile.types';
import { useCallback, useEffect, useState } from 'react';

export function useJarResolutionPreview(config: JarResolutionConfig, enabled: boolean) {
  const [result, setResult] = useState<JarResolutionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const preview = useCallback(async () => {
    if (!enabled || !config.baseDir || !config.pattern) {
      setResult(null);
      return;
    }
    setLoading(true);
    const res = await jrc.api.previewCandidates(config);
    setResult(res);
    setLoading(false);
  }, [config, enabled]);

  useEffect(() => {
    const t = setTimeout(preview, 400);
    return () => clearTimeout(t);
  }, [preview]);

  return { result, loading, refresh: preview };
}
