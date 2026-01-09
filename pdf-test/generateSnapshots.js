import { comparePdfToSnapshot } from 'pdf-visual-diff';
import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateSnapshots() {
  await rm(join(__dirname, '__snapshots__'), { recursive: true, force: true });
  const files = await readdir(join(__dirname, '/files'));
  for (const file of files) {
    console.log(`generating snapshot for ${file}`);
    await comparePdfToSnapshot(join(__dirname, '/files/', file), __dirname, file);
  }
}

generateSnapshots().then(() => console.log('Finished!'));
