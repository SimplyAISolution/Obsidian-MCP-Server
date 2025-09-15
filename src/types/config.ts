/**
 * Configuration Type Definitions
 */

export interface ServerConfig {
  vaultPath: string;
  maxFileSize: number;
  allowedExtensions: string[];
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface VaultResource {
  uri: string;
  name: string;
  content: string;
  metadata?: Record<string, unknown>;
}