/**
 * Tests for Client-side Input Sanitizer
 * Validates HTML stripping, script detection, control char removal, and field configs.
 */
import { describe, it, expect } from 'vitest';
import {
  containsDangerousPatterns,
  stripHtmlTags,
  stripControlChars,
  sanitizeText,
  getFieldConfig,
  FIELD_CONFIGS,
  type InputSecurityConfig,
} from './input-sanitizer';

describe('[P0][safety] input-sanitizer', () => {
  describe('stripHtmlTags', () => {
    it('should strip simple HTML tags', () => {
      expect(stripHtmlTags('<b>bold</b>')).toBe('bold');
    });

    it('should strip nested HTML tags', () => {
      expect(stripHtmlTags('<div><span>text</span></div>')).toBe('text');
    });

    it('should strip tags with attributes', () => {
      expect(stripHtmlTags('<a href="http://evil.com">click</a>')).toBe('click');
    });

    it('should strip self-closing tags', () => {
      expect(stripHtmlTags('before<br/>after')).toBe('beforeafter');
    });

    it('should handle text without tags', () => {
      expect(stripHtmlTags('plain text')).toBe('plain text');
    });

    it('should handle empty string', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('should strip script tags', () => {
      expect(stripHtmlTags('<script>alert("xss")</script>')).toBe('alert("xss")');
    });

    it('should strip multiple tags', () => {
      expect(stripHtmlTags('<p>Hello</p><p>World</p>')).toBe('HelloWorld');
    });
  });

  describe('stripControlChars', () => {
    it('should remove null bytes', () => {
      expect(stripControlChars('hello\x00world')).toBe('helloworld');
    });

    it('should remove bell character', () => {
      expect(stripControlChars('hello\x07world')).toBe('helloworld');
    });

    it('should preserve newlines and tabs', () => {
      // \n = 0x0A, \t = 0x09, \r = 0x0D are NOT stripped
      expect(stripControlChars('hello\n\tworld\r')).toBe('hello\n\tworld\r');
    });

    it('should remove multiple control characters', () => {
      expect(stripControlChars('\x01\x02\x03text\x04\x05')).toBe('text');
    });

    it('should handle clean text unchanged', () => {
      const text = 'Normal text with spaces';
      expect(stripControlChars(text)).toBe(text);
    });

    it('should remove DEL character (0x7F)', () => {
      expect(stripControlChars('hello\x7Fworld')).toBe('helloworld');
    });
  });

  describe('containsDangerousPatterns', () => {
    it('should detect script tags', () => {
      expect(containsDangerousPatterns('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect script tag with attributes', () => {
      expect(containsDangerousPatterns('<script src="evil.js">')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsDangerousPatterns('javascript:alert(1)')).toBe(true);
    });

    it('should detect javascript: with spaces', () => {
      expect(containsDangerousPatterns('javascript :void(0)')).toBe(true);
    });

    it('should detect inline event handlers', () => {
      expect(containsDangerousPatterns('onclick=alert(1)')).toBe(true);
      expect(containsDangerousPatterns('onload =malicious()')).toBe(true);
      expect(containsDangerousPatterns('onerror=hack()')).toBe(true);
    });

    it('should detect data:text/html URIs', () => {
      expect(containsDangerousPatterns('data:text/html,<script>alert(1)</script>')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsDangerousPatterns('<iframe src="evil.com">')).toBe(true);
    });

    it('should detect object tags', () => {
      expect(containsDangerousPatterns('<object data="evil.swf">')).toBe(true);
    });

    it('should detect embed tags', () => {
      expect(containsDangerousPatterns('<embed src="evil.swf">')).toBe(true);
    });

    it('should detect svg tags', () => {
      expect(containsDangerousPatterns('<svg onload="alert(1)">')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(containsDangerousPatterns('Hello, this is a normal message')).toBe(false);
    });

    it('should not flag text containing "script" as a word', () => {
      expect(containsDangerousPatterns('The script is well written')).toBe(false);
    });

    it('should not flag text containing "on" as a word', () => {
      expect(containsDangerousPatterns('I turned on the light')).toBe(false);
    });

    it('should be case insensitive for script patterns', () => {
      expect(containsDangerousPatterns('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
      expect(containsDangerousPatterns('JAVASCRIPT:void(0)')).toBe(true);
    });
  });

  describe('sanitizeText', () => {
    const defaultConfig: InputSecurityConfig = {
      maxLength: 100,
      blockHtmlTags: true,
      blockScriptPatterns: true,
      stripControlChars: true,
    };

    it('should return clean text unchanged', () => {
      const result = sanitizeText('Hello world', defaultConfig);
      expect(result.text).toBe('Hello world');
      expect(result.modified).toBe(false);
      expect(result.blocked).toBe(false);
    });

    it('should block text with script tags', () => {
      const result = sanitizeText('<script>alert("xss")</script>', defaultConfig);
      expect(result.text).toBe('');
      expect(result.blocked).toBe(true);
      expect(result.modified).toBe(true);
    });

    it('should block text with javascript: protocol', () => {
      const result = sanitizeText('javascript:alert(1)', defaultConfig);
      expect(result.text).toBe('');
      expect(result.blocked).toBe(true);
    });

    it('should strip HTML tags when blockHtmlTags is true', () => {
      const result = sanitizeText('Hello <b>world</b>', defaultConfig);
      expect(result.text).toBe('Hello world');
      expect(result.modified).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('should not strip HTML tags when blockHtmlTags is false', () => {
      const config: InputSecurityConfig = { ...defaultConfig, blockHtmlTags: false };
      const result = sanitizeText('Hello <b>world</b>', config);
      expect(result.text).toBe('Hello <b>world</b>');
      expect(result.modified).toBe(false);
    });

    it('should strip control characters when enabled', () => {
      const result = sanitizeText('hello\x00world', defaultConfig);
      expect(result.text).toBe('helloworld');
      expect(result.modified).toBe(true);
    });

    it('should not strip control characters when disabled', () => {
      const config: InputSecurityConfig = { ...defaultConfig, stripControlChars: false };
      const result = sanitizeText('hello\x00world', config);
      expect(result.text).toBe('hello\x00world');
      expect(result.modified).toBe(false);
    });

    it('should enforce maxLength', () => {
      const config: InputSecurityConfig = { ...defaultConfig, maxLength: 5 };
      const result = sanitizeText('Hello World', config);
      expect(result.text).toBe('Hello');
      expect(result.modified).toBe(true);
    });

    it('should not modify text within maxLength', () => {
      const config: InputSecurityConfig = { ...defaultConfig, maxLength: 20 };
      const result = sanitizeText('Hello', config);
      expect(result.text).toBe('Hello');
      expect(result.modified).toBe(false);
    });

    it('should not block when blockScriptPatterns is false', () => {
      const config: InputSecurityConfig = { ...defaultConfig, blockScriptPatterns: false };
      const result = sanitizeText('<script>alert(1)</script>', config);
      // HTML tags should be stripped but not blocked
      expect(result.blocked).toBe(false);
      expect(result.text).toBe('alert(1)');
    });

    it('should handle combined sanitization steps', () => {
      const result = sanitizeText('\x00Hello <b>World</b>', defaultConfig);
      expect(result.text).toBe('Hello World');
      expect(result.modified).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('should handle empty string', () => {
      const result = sanitizeText('', defaultConfig);
      expect(result.text).toBe('');
      expect(result.modified).toBe(false);
      expect(result.blocked).toBe(false);
    });

    it('should block inline event handlers', () => {
      const result = sanitizeText('<div onmouseover=alert(1)>hover</div>', defaultConfig);
      expect(result.blocked).toBe(true);
      expect(result.text).toBe('');
    });
  });

  describe('getFieldConfig', () => {
    it('should return name config for "name" field type', () => {
      const config = getFieldConfig('name');
      expect(config).toBe(FIELD_CONFIGS.name);
      expect(config.maxLength).toBe(50);
    });

    it('should return bio config for "bio" field type', () => {
      const config = getFieldConfig('bio');
      expect(config).toBe(FIELD_CONFIGS.bio);
      expect(config.maxLength).toBe(500);
    });

    it('should return message config for "message" field type', () => {
      const config = getFieldConfig('message');
      expect(config).toBe(FIELD_CONFIGS.message);
      expect(config.maxLength).toBe(2000);
    });

    it('should return search config for "search" field type', () => {
      const config = getFieldConfig('search');
      expect(config).toBe(FIELD_CONFIGS.search);
      expect(config.maxLength).toBe(100);
    });

    it('should return email config for "email" field type', () => {
      const config = getFieldConfig('email');
      expect(config).toBe(FIELD_CONFIGS.email);
      expect(config.maxLength).toBe(254);
    });

    it('should return hobby config for "hobby" field type', () => {
      const config = getFieldConfig('hobby');
      expect(config).toBe(FIELD_CONFIGS.hobby);
      expect(config.maxLength).toBe(100);
    });

    it('should fall back to message config for unknown field type', () => {
      const config = getFieldConfig('nonexistent');
      expect(config).toBe(FIELD_CONFIGS.message);
    });
  });

  describe('FIELD_CONFIGS', () => {
    it('should have all configs with blockHtmlTags enabled', () => {
      for (const [, config] of Object.entries(FIELD_CONFIGS)) {
        expect(config.blockHtmlTags).toBe(true);
      }
    });

    it('should have all configs with blockScriptPatterns enabled', () => {
      for (const [, config] of Object.entries(FIELD_CONFIGS)) {
        expect(config.blockScriptPatterns).toBe(true);
      }
    });

    it('should have all configs with stripControlChars enabled', () => {
      for (const [, config] of Object.entries(FIELD_CONFIGS)) {
        expect(config.stripControlChars).toBe(true);
      }
    });

    it('should have name config with allowed character pattern', () => {
      expect(FIELD_CONFIGS.name.allowedCharPattern).toBeDefined();
    });

    it('should have search config with allowed character pattern', () => {
      expect(FIELD_CONFIGS.search.allowedCharPattern).toBeDefined();
    });
  });
});
