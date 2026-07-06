import {cp, mkdir, stat} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const distAssets = path.join(root, 'dist', 'client', 'assets');
const publicAssets = path.join(root, 'public', 'assets');

try {
  await stat(distAssets);
  await mkdir(publicAssets, {recursive: true});
  await cp(distAssets, publicAssets, {recursive: true, force: true});
  console.log('Copied dist/client/assets -> public/assets for Vercel static serving');
} catch (error) {
  console.warn('Skipping asset copy:', error?.message || error);
}
