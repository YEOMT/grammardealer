import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Windows WebKit's native video writer rejects non-ASCII output paths.
// Keep recording enabled; archive every completed recording with the test evidence.
export async function browserVideo(engine, output) {
  const nativeTemp = engine === 'webkit' && process.platform === 'win32';
  const directory = nativeTemp ? await fs.mkdtemp(path.join(os.tmpdir(), 'syntax-atlas-v051-')) : output;
  return {
    options: {dir: directory},
    async archive() {
      if (!nativeTemp) return;
      for (const name of await fs.readdir(directory)) {
        if (name.endsWith('.webm')) await fs.copyFile(path.join(directory, name), path.join(output, name));
      }
      // Retain the raw temporary recording as well; do not recursively delete paths.
    },
  };
}
