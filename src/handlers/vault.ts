/**
 * Obsidian Vault Handler
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { validatePath } from '../utils/security.js';
import type { VaultResource } from '../types/config.js';

export class VaultHandler {
  constructor(private vaultPath: string) {}

  async readResource(uri: string): Promise<VaultResource> {
    const filePath = this.extractPathFromUri(uri);
    const safePath = validatePath(this.vaultPath, filePath);
    
    const stats = await fs.stat(safePath);
    if (!stats.isFile()) {
      throw new Error('Resource is not a file');
    }

    const content = await fs.readFile(safePath, 'utf-8');
    
    return {
      uri,
      name: path.basename(safePath),
      content,
      metadata: {
        size: stats.size,
        modified: stats.mtime,
        path: path.relative(this.vaultPath, safePath)
      }
    };
  }

  private extractPathFromUri(uri: string): string {
    const match = uri.match(/^obsidian:\/\/(.+)$/);
    if (!match) {
      throw new Error('Invalid URI format');
    }
    return decodeURIComponent(match[1]);
  }
}