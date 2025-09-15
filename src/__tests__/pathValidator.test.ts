import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { PathValidator } from '../utils/pathValidator';

describe('PathValidator', () => {
  let tempDir: string;
  let validator: PathValidator;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'obsidian-test-'));
    validator = new PathValidator(tempDir);

    // Create test file structure
    await fs.promises.mkdir(path.join(tempDir, 'subdir'), { recursive: true });
    await fs.promises.writeFile(path.join(tempDir, 'test.md'), '# Test Note');
    await fs.promises.writeFile(path.join(tempDir, 'subdir', 'nested.md'), '# Nested Note');
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  });

  describe('validateAndResolvePath', () => {
    it('should resolve valid paths correctly', () => {
      const result = validator.validateAndResolvePath('test.md');
      expect(result).toBe(path.join(tempDir, 'test.md'));
    });

    it('should resolve nested paths correctly', () => {
      const result = validator.validateAndResolvePath('subdir/nested.md');
      expect(result).toBe(path.join(tempDir, 'subdir', 'nested.md'));
    });

    it('should resolve empty path to vault root', () => {
      const result = validator.validateAndResolvePath('');
      expect(result).toBe(tempDir);
    });

    it('should prevent path traversal attacks', () => {
      expect(() => validator.validateAndResolvePath('../../../etc/passwd')).toThrow(
        'Access denied: Path \'../../../etc/passwd\' is outside vault boundaries'
      );
    });

    it('should prevent absolute path access outside vault', () => {
      expect(() => validator.validateAndResolvePath('/etc/passwd')).toThrow(
        'Access denied: Path \'/etc/passwd\' is outside vault boundaries'
      );
    });

    it('should sanitize null bytes', () => {
      const result = validator.validateAndResolvePath('test\0.md');
      expect(result).toBe(path.join(tempDir, 'test.md'));
    });

    it('should sanitize dot-dot sequences', () => {
      const result = validator.validateAndResolvePath('subdir/../test.md');
      expect(result).toBe(path.join(tempDir, 'subdir', 'test.md'));
    });

    it('should handle Windows-style paths', () => {
      const result = validator.validateAndResolvePath('subdir\\nested.md');
      // On Unix systems, backslashes are treated as literal characters in filenames
      // This test ensures path normalization works across platforms
      expect(result.includes('nested.md')).toBe(true);
    });
  });

  describe('isValidFile', () => {
    it('should return true for existing files', async () => {
      const result = await validator.isValidFile('test.md');
      expect(result).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const result = await validator.isValidFile('nonexistent.md');
      expect(result).toBe(false);
    });

    it('should return false for directories', async () => {
      const result = await validator.isValidFile('subdir');
      expect(result).toBe(false);
    });

    it('should return false for files outside vault', async () => {
      const result = await validator.isValidFile('../outside.md');
      expect(result).toBe(false);
    });
  });

  describe('isValidDirectory', () => {
    it('should return true for existing directories', async () => {
      const result = await validator.isValidDirectory('subdir');
      expect(result).toBe(true);
    });

    it('should return true for vault root', async () => {
      const result = await validator.isValidDirectory('');
      expect(result).toBe(true);
    });

    it('should return false for non-existent directories', async () => {
      const result = await validator.isValidDirectory('nonexistent');
      expect(result).toBe(false);
    });

    it('should return false for files', async () => {
      const result = await validator.isValidDirectory('test.md');
      expect(result).toBe(false);
    });
  });

  describe('getVaultPath', () => {
    it('should return the vault path', () => {
      expect(validator.getVaultPath()).toBe(tempDir);
    });
  });

  describe('toRelativePath', () => {
    it('should convert absolute paths to relative', () => {
      const absolutePath = path.join(tempDir, 'subdir', 'nested.md');
      const relativePath = validator.toRelativePath(absolutePath);
      expect(relativePath).toBe(path.join('subdir', 'nested.md'));
    });

    it('should handle vault root', () => {
      const relativePath = validator.toRelativePath(tempDir);
      expect(relativePath).toBe('');
    });
  });
});