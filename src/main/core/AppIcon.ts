import { app, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';
import { getEnvironment } from './JRCEnvironment';

function getResourcesPath(): string {
  return getEnvironment().type === 'dev'
    ? path.join(__dirname, '../../../resources')
    : path.join(app.getAppPath(), 'resources');
}

export function getIconImage(): Electron.NativeImage {
  const resources = getResourcesPath();
  const candidates =
    process.platform === 'win32' ? ['icon.ico', 'icon.png'] : ['icon.png', 'icon.ico'];
  for (const name of candidates) {
    const p = path.join(resources, name);
    if (fs.existsSync(p)) {
      const img = nativeImage.createFromPath(p);
      if (!img.isEmpty()) return img;
    }
  }
  return nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  );
}
