/**
 * Security Utilities Tests
 */

import { validatePath, isAllowedExtension } from '../../src/utils/security';

describe('Security Utils', () => {
  describe('validatePath', () => {
    const vaultPath = '/safe/vault';

    it('should allow valid paths within vault', () => {
      expect(() => validatePath(vaultPath, 'note.md')).not.toThrow();
      expect(() => validatePath(vaultPath, 'folder/note.md')).not.toThrow();
    });

    it('should prevent directory traversal', () => {
      expect(() => validatePath(vaultPath, '../../../etc/passwd')).toThrow();
      expect(() => validatePath(vaultPath, '../../sensitive.txt')).toThrow();
    });
  });

  describe('isAllowedExtension', () => {
    const allowedExtensions = ['.md', '.txt'];

    it('should allow permitted extensions', () => {
      expect(isAllowedExtension('note.md', allowedExtensions)).toBe(true);
      expect(isAllowedExtension('file.txt', allowedExtensions)).toBe(true);
    });

    it('should reject forbidden extensions', () => {
      expect(isAllowedExtension('script.js', allowedExtensions)).toBe(false);
      expect(isAllowedExtension('config.exe', allowedExtensions)).toBe(false);
    });
  });
});