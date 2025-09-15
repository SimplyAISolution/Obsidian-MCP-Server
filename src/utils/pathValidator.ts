import * as path from 'path';
import { promises as fs } from 'fs';

/**
 * Security utilities for safe path handling and validation
 */
export class PathValidator {
  private readonly vaultPath: string;

  /**
   * Creates a new PathValidator instance
   * @param vaultPath - The absolute path to the Obsidian vault
   */
  constructor(vaultPath: string) {
    this.vaultPath = path.resolve(vaultPath);
  }

  /**
   * Validates and resolves a path to ensure it's within the vault boundaries
   * @param relativePath - The relative path to validate
   * @returns The resolved absolute path if valid
   * @throws Error if the path is invalid or outside vault boundaries
   */
  validateAndResolvePath(relativePath: string): string {
    // Sanitize input - remove null bytes and other dangerous characters
    const sanitized = relativePath.replace(/\0/g, '').replace(/\.\./g, '');
    
    // Resolve the path relative to the vault
    const resolvedPath = path.resolve(this.vaultPath, sanitized);
    
    // Ensure the resolved path is within the vault boundaries
    if (!resolvedPath.startsWith(this.vaultPath + path.sep) && resolvedPath !== this.vaultPath) {
      throw new Error(`Access denied: Path '${relativePath}' is outside vault boundaries`);
    }
    
    return resolvedPath;
  }

  /**
   * Checks if a file exists and is accessible within the vault
   * @param relativePath - The relative path to check
   * @returns Promise resolving to true if file exists and is accessible
   */
  async isValidFile(relativePath: string): Promise<boolean> {
    try {
      const resolvedPath = this.validateAndResolvePath(relativePath);
      const stats = await fs.stat(resolvedPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Checks if a directory exists and is accessible within the vault
   * @param relativePath - The relative path to check
   * @returns Promise resolving to true if directory exists and is accessible
   */
  async isValidDirectory(relativePath: string): Promise<boolean> {
    try {
      const resolvedPath = this.validateAndResolvePath(relativePath);
      const stats = await fs.stat(resolvedPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Gets the vault path
   * @returns The absolute path to the vault
   */
  getVaultPath(): string {
    return this.vaultPath;
  }

  /**
   * Converts an absolute path back to a relative path from the vault root
   * @param absolutePath - The absolute path to convert
   * @returns The relative path from vault root
   */
  toRelativePath(absolutePath: string): string {
    return path.relative(this.vaultPath, absolutePath);
  }
}