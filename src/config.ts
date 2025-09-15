/**
 * Configuration Management
 */

import { z } from 'zod';
import * as fs from 'fs';

const ConfigSchema = z.object({
  vaultPath: z.string().min(1),
  maxFileSize: z.number().positive().default(10 * 1024 * 1024), // 10MB
  allowedExtensions: z.array(z.string()).default(['.md', '.txt']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
});

export type ServerConfig = z.infer<typeof ConfigSchema>;

export function loadConfig(): ServerConfig {
  const config = {
    vaultPath: process.env['VAULT_PATH'] || '',
    maxFileSize: process.env['MAX_FILE_SIZE'] ? parseInt(process.env['MAX_FILE_SIZE']) : undefined,
    allowedExtensions: process.env['ALLOWED_EXTENSIONS']?.split(',') || undefined,
    logLevel: (process.env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info'
  };

  const parsed = ConfigSchema.parse(config);

  // Validate vault path exists
  if (!fs.existsSync(parsed.vaultPath)) {
    throw new Error(`Vault path does not exist: ${parsed.vaultPath}`);
  }

  return parsed;
}