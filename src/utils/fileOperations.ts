import { promises as fs } from 'fs';
import * as path from 'path';
import { PathValidator } from './pathValidator';

/**
 * File metadata information
 */
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
  extension?: string;
}

/**
 * Search result for file content
 */
export interface SearchResult {
  file: string;
  line: number;
  content: string;
  match: string;
}

/**
 * Safe file operations for Obsidian vault access
 */
export class FileOperations {
  private readonly pathValidator: PathValidator;

  /**
   * Creates a new FileOperations instance
   * @param vaultPath - The absolute path to the Obsidian vault
   */
  constructor(vaultPath: string) {
    this.pathValidator = new PathValidator(vaultPath);
  }

  /**
   * Safely reads a file's content
   * @param relativePath - The relative path to the file
   * @returns Promise resolving to the file content as string
   * @throws Error if file doesn't exist or is inaccessible
   */
  async readFile(relativePath: string): Promise<string> {
    const resolvedPath = this.pathValidator.validateAndResolvePath(relativePath);
    
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return content;
    } catch (error: unknown) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        throw new Error(`File not found: ${relativePath}`);
      }
      const message = nodeError.message || 'Unknown error';
      throw new Error(`Failed to read file '${relativePath}': ${message}`);
    }
  }

  /**
   * Gets file or directory information
   * @param relativePath - The relative path to check
   * @returns Promise resolving to FileInfo object
   * @throws Error if path doesn't exist or is inaccessible
   */
  async getFileInfo(relativePath: string): Promise<FileInfo> {
    const resolvedPath = this.pathValidator.validateAndResolvePath(relativePath);
    
    try {
      const stats = await fs.stat(resolvedPath);
      const fileName = path.basename(resolvedPath);
      const extension = path.extname(fileName);
      
      const fileInfo: FileInfo = {
        name: fileName,
        path: relativePath,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
      
      if (extension) {
        fileInfo.extension = extension;
      }
      
      return fileInfo;
    } catch (error) {
      throw new Error(`Failed to get info for '${relativePath}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Lists files and directories in a directory
   * @param relativePath - The relative path to the directory (defaults to vault root)
   * @param recursive - Whether to list recursively
   * @returns Promise resolving to array of FileInfo objects
   */
  async listDirectory(relativePath = '', recursive = false): Promise<FileInfo[]> {
    const resolvedPath = this.pathValidator.validateAndResolvePath(relativePath);
    
    try {
      const entries = await fs.readdir(resolvedPath);
      const results: FileInfo[] = [];
      
      for (const entry of entries) {
        // Skip hidden files and .obsidian directory
        if (entry.startsWith('.')) {
          continue;
        }
        
        const entryPath = path.join(relativePath, entry);
        
        try {
          const fileInfo = await this.getFileInfo(entryPath);
          results.push(fileInfo);
          
          if (recursive && fileInfo.isDirectory) {
            const subResults = await this.listDirectory(entryPath, true);
            results.push(...subResults);
          }
        } catch {
          // Skip inaccessible files
          continue;
        }
      }
      
      return results.sort((a, b) => {
        // Directories first, then files, both alphabetically
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(`Failed to list directory '${relativePath}': ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Searches for text within files in the vault
   * @param query - The search query
   * @param filePattern - Optional file pattern to filter (e.g., "*.md")
   * @param caseSensitive - Whether search should be case sensitive
   * @returns Promise resolving to array of SearchResult objects
   */
  async searchFiles(
    query: string,
    filePattern = '*.md',
    caseSensitive = false
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchRegex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      caseSensitive ? 'g' : 'gi'
    );

    // Get all files recursively
    const files = await this.listDirectory('', true);
    const markdownFiles = files.filter(file => 
      !file.isDirectory && 
      this.matchesPattern(file.name, filePattern)
    );

    for (const file of markdownFiles) {
      try {
        const content = await this.readFile(file.path);
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          const matches = line.match(searchRegex);
          if (matches) {
            matches.forEach(match => {
              results.push({
                file: file.path,
                line: index + 1,
                content: line.trim(),
                match: match,
              });
            });
          }
        });
      } catch {
        // Skip files that can't be read
        continue;
      }
    }
    
    return results;
  }

  /**
   * Checks if a filename matches a pattern
   * @param filename - The filename to check
   * @param pattern - The pattern to match against
   * @returns True if filename matches pattern
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
      'i'
    );
    return regex.test(filename);
  }

  /**
   * Gets the path validator instance
   * @returns The PathValidator instance
   */
  getPathValidator(): PathValidator {
    return this.pathValidator;
  }
}