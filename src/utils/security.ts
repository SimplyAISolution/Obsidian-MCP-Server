/**
 * Security Utilities
 */

import * as path from 'path';

/**
 * Validates that a file path is within the allowed vault directory
 * Prevents directory traversal attacks
 */
export function validatePath(vaultPath: string, requestedPath: string): string {
  const resolvedVault = path.resolve(vaultPath);
  const resolvedPath = path.resolve(vaultPath, requestedPath);
  
  if (!resolvedPath.startsWith(resolvedVault + path.sep) && resolvedPath !== resolvedVault) {
    throw new Error('Path traversal detected: access denied');
  }
  
  return resolvedPath;
}

/**
 * Checks if file extension is allowed
 */
export function isAllowedExtension(filePath: string, allowedExtensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return allowedExtensions.includes(ext);
}