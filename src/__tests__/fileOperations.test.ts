import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { FileOperations } from '../utils/fileOperations';

describe('FileOperations', () => {
  let tempDir: string;
  let fileOps: FileOperations;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'obsidian-test-'));
    fileOps = new FileOperations(tempDir);

    // Create test file structure
    await fs.promises.mkdir(path.join(tempDir, 'subdir'), { recursive: true });
    await fs.promises.mkdir(path.join(tempDir, '.obsidian'), { recursive: true });
    await fs.promises.writeFile(path.join(tempDir, 'note1.md'), '# Note 1\nThis is a test note with some content.');
    await fs.promises.writeFile(path.join(tempDir, 'note2.md'), '# Note 2\nAnother test note with different content.');
    await fs.promises.writeFile(path.join(tempDir, 'subdir', 'nested.md'), '# Nested Note\nA note in a subdirectory.');
    await fs.promises.writeFile(path.join(tempDir, 'document.txt'), 'Plain text document');
    await fs.promises.writeFile(path.join(tempDir, '.hidden.md'), 'Hidden file');
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read file contents correctly', async () => {
      const content = await fileOps.readFile('note1.md');
      expect(content).toBe('# Note 1\nThis is a test note with some content.');
    });

    it('should read nested file contents correctly', async () => {
      const content = await fileOps.readFile('subdir/nested.md');
      expect(content).toBe('# Nested Note\nA note in a subdirectory.');
    });

    it('should throw error for non-existent files', async () => {
      await expect(fileOps.readFile('nonexistent.md')).rejects.toThrow(
        'File not found: nonexistent.md'
      );
    });

    it('should throw error for directories', async () => {
      await expect(fileOps.readFile('subdir')).rejects.toThrow(
        'Failed to read file \'subdir\''
      );
    });
  });

  describe('getFileInfo', () => {
    it('should return correct file info', async () => {
      const info = await fileOps.getFileInfo('note1.md');
      expect(info.name).toBe('note1.md');
      expect(info.path).toBe('note1.md');
      expect(info.isDirectory).toBe(false);
      expect(info.extension).toBe('.md');
      expect(info.size).toBeGreaterThan(0);
      expect(typeof info.modified === 'object' || typeof info.modified === 'string').toBe(true);
    });

    it('should return correct directory info', async () => {
      const info = await fileOps.getFileInfo('subdir');
      expect(info.name).toBe('subdir');
      expect(info.path).toBe('subdir');
      expect(info.isDirectory).toBe(true);
      expect(info.extension).toBeUndefined();
    });
  });

  describe('listDirectory', () => {
    it('should list files in root directory', async () => {
      const files = await fileOps.listDirectory();
      const names = files.map(f => f.name).sort();
      expect(names).toContain('note1.md');
      expect(names).toContain('note2.md');
      expect(names).toContain('subdir');
      expect(names).toContain('document.txt');
      expect(names).not.toContain('.hidden.md'); // Hidden files should be filtered
      expect(names).not.toContain('.obsidian'); // .obsidian directory should be filtered
    });

    it('should list files recursively', async () => {
      const files = await fileOps.listDirectory('', true);
      const paths = files.map(f => f.path).sort();
      expect(paths).toContain('note1.md');
      expect(paths).toContain('subdir');
      expect(paths).toContain(path.join('subdir', 'nested.md'));
    });

    it('should list files in subdirectory', async () => {
      const files = await fileOps.listDirectory('subdir');
      expect(files).toHaveLength(1);
      expect(files[0]?.name).toBe('nested.md');
    });

    it('should sort directories before files', async () => {
      const files = await fileOps.listDirectory();
      const directories = files.filter(f => f.isDirectory);
      const regularFiles = files.filter(f => !f.isDirectory);
      
      // Find indices of first directory and first file
      const firstDirIndex = files.findIndex(f => f.isDirectory);
      const firstFileIndex = files.findIndex(f => !f.isDirectory);
      
      if (directories.length > 0 && regularFiles.length > 0) {
        expect(firstDirIndex).toBeLessThan(firstFileIndex);
      }
    });
  });

  describe('searchFiles', () => {
    it('should find text in files', async () => {
      const results = await fileOps.searchFiles('test note');
      expect(results).toHaveLength(2);
      expect(results.map(r => r.file)).toContain('note1.md');
      expect(results.map(r => r.file)).toContain('note2.md');
    });

    it('should be case insensitive by default', async () => {
      const results = await fileOps.searchFiles('TEST NOTE');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect case sensitivity when requested', async () => {
      const results = await fileOps.searchFiles('TEST NOTE', '*.md', true);
      expect(results).toHaveLength(0);
    });

    it('should filter by file pattern', async () => {
      const results = await fileOps.searchFiles('document', '*.txt');
      expect(results).toHaveLength(1);
      expect(results[0]?.file).toBe('document.txt');
    });

    it('should return line numbers correctly', async () => {
      const results = await fileOps.searchFiles('Note 1');
      expect(results[0]?.line).toBe(1);
    });

    it('should return empty array when no matches found', async () => {
      const results = await fileOps.searchFiles('nonexistent text');
      expect(results).toHaveLength(0);
    });
  });

  describe('security', () => {
    it('should prevent reading files outside vault', async () => {
      await expect(fileOps.readFile('../outside.txt')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should prevent listing directories outside vault', async () => {
      await expect(fileOps.listDirectory('../')).rejects.toThrow(
        'Access denied'
      );
    });

    it('should prevent getting info for files outside vault', async () => {
      await expect(fileOps.getFileInfo('/etc/passwd')).rejects.toThrow(
        'Access denied'
      );
    });
  });
});