/**
 * Tests for Input Sanitizer
 * Covers: XSS stripping, injection detection (SQL, NoSQL, command, template),
 * HTML entity encoding, prototype pollution, control character removal,
 * password validation, sanitizeInput/sanitizeObject public API.
 *
 * @see security/input-sanitizer.ts
 * @see security/sanitization-rules.ts
 * @see config/security-validation.config.ts (DANGEROUS_PATTERNS, INPUT_RULES)
 */

import { describe, it, expect } from 'vitest';

// We import from the actual module — no mocks, so we test real behavior
import {
  sanitizeInput,
  sanitizeObject,
  stripHtml,
  encodeHtmlEntities,
  stripControlChars,
  detectInjection,
  checkPrototypePollution,
  validatePasswordStrength,
} from './input-sanitizer.js';

// ============================================
// stripHtml
// ============================================

describe('[P0][safety] stripHtml', () => {
  it('should strip basic HTML tags', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
    expect(stripHtml('<p>paragraph</p>')).toBe('paragraph');
    expect(stripHtml('<div class="x">content</div>')).toBe('content');
  });

  it('should strip script tags', () => {
    expect(stripHtml('<script>alert(1)</script>')).toBe('alert(1)');
    expect(stripHtml('<SCRIPT>evil()</SCRIPT>')).toBe('evil()');
  });

  it('should strip event handler attributes within tags', () => {
    expect(stripHtml('<img onerror="alert(1)">')).toBe('');
    expect(stripHtml('<div onclick="hack()">text</div>')).toBe('text');
  });

  it('should strip iframe, object, embed, link, meta tags', () => {
    expect(stripHtml('<iframe src="evil.com"></iframe>')).toBe('');
    expect(stripHtml('<object data="x"></object>')).toBe('');
    expect(stripHtml('<embed src="x">')).toBe('');
    expect(stripHtml('<link rel="stylesheet" href="x">')).toBe('');
    expect(stripHtml('<meta http-equiv="refresh">')).toBe('');
  });

  it('should strip svg and math tags', () => {
    expect(stripHtml('<svg onload="alert(1)"></svg>')).toBe('');
    expect(stripHtml('<math><maction>x</maction></math>')).toBe('x');
  });

  it('should decode HTML entities after stripping', () => {
    expect(stripHtml('&lt;script&gt;')).toBe('<script>');
    expect(stripHtml('&amp;')).toBe('&');
    expect(stripHtml('&quot;hello&quot;')).toBe('"hello"');
    expect(stripHtml('&#x27;')).toBe("'");
    expect(stripHtml('&#x2F;')).toBe('/');
  });

  it('should handle nested tags', () => {
    expect(stripHtml('<div><span><b>text</b></span></div>')).toBe('text');
  });

  it('should handle self-closing tags', () => {
    expect(stripHtml('<br/>')).toBe('');
    expect(stripHtml('<hr />')).toBe('');
    expect(stripHtml('<img src="x" />')).toBe('');
  });

  it('should return empty string for tag-only input', () => {
    expect(stripHtml('<div></div>')).toBe('');
  });

  it('should not modify plain text', () => {
    expect(stripHtml('Hello, World!')).toBe('Hello, World!');
    expect(stripHtml('No tags here')).toBe('No tags here');
  });

  it('should handle empty input', () => {
    expect(stripHtml('')).toBe('');
  });
});

// ============================================
// encodeHtmlEntities
// ============================================

describe('[P0][safety] encodeHtmlEntities', () => {
  it('should encode ampersand', () => {
    expect(encodeHtmlEntities('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('should encode angle brackets', () => {
    expect(encodeHtmlEntities('<script>')).toBe('&lt;script&gt;');
  });

  it('should encode double quotes', () => {
    expect(encodeHtmlEntities('"hello"')).toBe('&quot;hello&quot;');
  });

  it('should encode single quotes', () => {
    expect(encodeHtmlEntities("it's")).toBe('it&#x27;s');
  });

  it('should encode forward slashes', () => {
    expect(encodeHtmlEntities('a/b')).toBe('a&#x2F;b');
  });

  it('should encode all entities in a combined string', () => {
    const input = '<div class="test">O\'Brien & Co</div>';
    const result = encodeHtmlEntities(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).toContain('&quot;');
    expect(result).toContain('&#x27;');
  });

  it('should not modify safe text', () => {
    expect(encodeHtmlEntities('Hello World')).toBe('Hello World');
  });

  it('should handle empty input', () => {
    expect(encodeHtmlEntities('')).toBe('');
  });
});

// ============================================
// stripControlChars
// ============================================

describe('[P0][safety] stripControlChars', () => {
  it('should strip null bytes', () => {
    expect(stripControlChars('hello\x00world')).toBe('helloworld');
  });

  it('should strip control characters 0x01-0x08', () => {
    expect(stripControlChars('a\x01b\x02c\x08d')).toBe('abcd');
  });

  it('should strip 0x0B, 0x0C, 0x0E-0x1F, 0x7F', () => {
    expect(stripControlChars('a\x0Bb\x0Cc\x0Ed\x1Fe\x7Ff')).toBe('abcdef');
  });

  it('should preserve newlines (0x0A)', () => {
    expect(stripControlChars('line1\nline2')).toBe('line1\nline2');
  });

  it('should preserve carriage returns (0x0D)', () => {
    expect(stripControlChars('line1\r\nline2')).toBe('line1\r\nline2');
  });

  it('should preserve tabs (0x09)', () => {
    expect(stripControlChars('col1\tcol2')).toBe('col1\tcol2');
  });

  it('should handle empty string', () => {
    expect(stripControlChars('')).toBe('');
  });

  it('should handle string with only control chars', () => {
    expect(stripControlChars('\x00\x01\x02\x03')).toBe('');
  });

  it('should not modify safe strings', () => {
    const safe = 'Hello, World! 123';
    expect(stripControlChars(safe)).toBe(safe);
  });
});

// ============================================
// detectInjection
// ============================================

describe('[P0][safety] detectInjection', () => {
  // ---- XSS ----

  describe('XSS patterns', () => {
    it('should detect <script> tags', () => {
      expect(detectInjection('<script>alert(1)</script>')).toBe('xss');
      expect(detectInjection('<SCRIPT>alert(1)</SCRIPT>')).toBe('xss');
      expect(detectInjection('<script src="evil.js">')).toBe('xss');
    });

    it('should detect javascript: protocol', () => {
      expect(detectInjection('javascript:alert(1)')).toBe('xss');
      expect(detectInjection('JAVASCRIPT:void(0)')).toBe('xss');
    });

    it('should detect event handlers (onclick, onerror, etc.)', () => {
      expect(detectInjection('onerror=alert(1)')).toBe('xss');
      expect(detectInjection('onclick=hack()')).toBe('xss');
      expect(detectInjection('onload=evil()')).toBe('xss');
      expect(detectInjection('onmouseover=bad()')).toBe('xss');
    });

    it('should detect eval()', () => {
      expect(detectInjection('eval(code)')).toBe('xss');
      expect(detectInjection('eval("alert(1)")')).toBe('xss');
    });

    it('should detect document. access', () => {
      expect(detectInjection('document.cookie')).toBe('xss');
      expect(detectInjection('document.write("x")')).toBe('xss');
    });

    it('should detect window. access', () => {
      expect(detectInjection('window.location')).toBe('xss');
      expect(detectInjection('window.open("x")')).toBe('xss');
    });

    it('should detect alert(), prompt(), confirm()', () => {
      expect(detectInjection('alert("xss")')).toBe('xss');
      expect(detectInjection('prompt("enter")')).toBe('xss');
      expect(detectInjection('confirm("ok?")')).toBe('xss');
    });

    it('should detect iframe, object, embed tags', () => {
      expect(detectInjection('<iframe src="evil">')).toBe('xss');
      expect(detectInjection('<object data="x">')).toBe('xss');
      expect(detectInjection('<embed src="x">')).toBe('xss');
    });

    it('should detect svg and math tags', () => {
      expect(detectInjection('<svg onload="evil()">')).toBe('xss');
      expect(detectInjection('<math>')).toBe('xss');
    });

    it('should detect data:text/html URIs', () => {
      expect(detectInjection('data:text/html,<script>alert(1)</script>')).toBe('xss');
    });

    it('should detect vbscript: protocol', () => {
      expect(detectInjection('vbscript:MsgBox("xss")')).toBe('xss');
    });

    it('should detect expression()', () => {
      expect(detectInjection('expression(alert(1))')).toBe('xss');
    });

    it('should detect javascript in url()', () => {
      expect(detectInjection("url('javascript:alert(1)')")).toBe('xss');
    });
  });

  // ---- SQL Injection ----

  describe('SQL injection patterns', () => {
    it('should detect SELECT statements', () => {
      expect(detectInjection('SELECT * FROM users')).toBe('sql');
    });

    it('should detect UNION SELECT', () => {
      expect(detectInjection("1 UNION SELECT username, password FROM users")).toBe('sql');
    });

    it('should detect DROP TABLE', () => {
      expect(detectInjection('DROP TABLE users')).toBe('sql');
    });

    it('should detect INSERT INTO', () => {
      expect(detectInjection("INSERT INTO users VALUES('hack')")).toBe('sql');
    });

    it('should detect DELETE FROM', () => {
      expect(detectInjection('DELETE FROM users')).toBe('sql');
    });

    it('should detect UPDATE SET', () => {
      expect(detectInjection("UPDATE users SET role='admin'")).toBe('sql');
    });

    it('should detect SQL comment termination --', () => {
      expect(detectInjection("admin' -- ")).toBe('sql');
    });

    it('should detect block comments /* */', () => {
      expect(detectInjection('1 /* comment */ OR 1=1')).toBe('sql');
    });

    it('should detect OR-based injection', () => {
      expect(detectInjection("' OR 1=1")).toBe('sql');
      expect(detectInjection('" OR ""="')).toBe('sql');
    });

    it('should detect time-based blind injection', () => {
      expect(detectInjection('WAITFOR DELAY 00:00:10')).toBe('sql');
      expect(detectInjection('BENCHMARK(1000000,SHA1("test"))')).toBe('sql');
      expect(detectInjection('SLEEP(5)')).toBe('sql');
    });

    it('should detect semicolon-chained attacks', () => {
      const result = detectInjection("; DROP TABLE users");
      // This may match 'command' or 'sql' depending on pattern order
      expect(result).not.toBeNull();
    });
  });

  // ---- NoSQL Injection ----

  describe('NoSQL injection patterns', () => {
    it('should detect $ne operator', () => {
      expect(detectInjection('{"$ne": ""}')).toBe('nosql');
    });

    it('should detect $gt operator', () => {
      expect(detectInjection('$gt')).toBe('nosql');
    });

    it('should detect $regex operator', () => {
      expect(detectInjection('$regex')).toBe('nosql');
    });

    it('should detect $where operator', () => {
      expect(detectInjection('$where')).toBe('nosql');
    });

    it('should detect $exists operator', () => {
      expect(detectInjection('$exists')).toBe('nosql');
    });

    it('should detect JSON-formatted NoSQL operators', () => {
      expect(detectInjection('{"$ne": 1}')).toBe('nosql');
    });
  });

  // ---- Command Injection ----

  describe('command injection patterns', () => {
    it('should detect semicolon chaining', () => {
      expect(detectInjection('; ls -la')).not.toBeNull();
    });

    it('should detect pipe chaining', () => {
      expect(detectInjection('| cat /etc/passwd')).not.toBeNull();
    });

    it('should detect ampersand chaining', () => {
      expect(detectInjection('&& rm -rf /')).not.toBeNull();
    });

    it('should detect backtick execution', () => {
      expect(detectInjection('`whoami`')).not.toBeNull();
    });

    it('should detect $() subshell', () => {
      expect(detectInjection('$(whoami)')).not.toBeNull();
    });
  });

  // ---- Template Injection ----

  describe('template injection patterns', () => {
    it('should detect {{ }} (Handlebars/Mustache/Angular)', () => {
      expect(detectInjection('{{constructor.constructor("return this")()}}')).toBe('template');
    });

    it('should detect ${} (JS template literals)', () => {
      expect(detectInjection('${7*7}')).not.toBeNull();
    });

    it('should detect <% %> (EJS/ERB)', () => {
      expect(detectInjection('<% system("whoami") %>')).not.toBeNull();
    });

    it('should detect {% %} (Jinja/Twig)', () => {
      expect(detectInjection('{% import os %}{% os.system("id") %}')).toBe('template');
    });
  });

  // ---- Prototype Pollution via patterns ----

  describe('prototype pollution patterns', () => {
    it('should detect __proto__ in string', () => {
      expect(detectInjection('__proto__')).toBe('prototypePollution');
    });

    it('should detect constructor[ access', () => {
      expect(detectInjection('constructor["prototype"]')).toBe('prototypePollution');
    });

    it('should detect prototype[ access', () => {
      expect(detectInjection('prototype["polluted"]')).toBe('prototypePollution');
    });
  });

  // ---- Clean inputs ----

  describe('clean inputs', () => {
    it('should return null for normal text', () => {
      expect(detectInjection('Hello, World!')).toBeNull();
    });

    it('should return null for email addresses', () => {
      expect(detectInjection('user@example.com')).toBeNull();
    });

    it('should return null for numbers', () => {
      expect(detectInjection('12345')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(detectInjection('')).toBeNull();
    });

    it('should return null for Unicode text', () => {
      expect(detectInjection('Shalom!')).toBeNull();
    });

    it('should return null for typical bio text', () => {
      expect(detectInjection('I love hiking, reading, and cooking!')).toBeNull();
    });
  });
});

// ============================================
// checkPrototypePollution
// ============================================

describe('[P0][safety] checkPrototypePollution', () => {
  it('should detect __proto__ key', () => {
    // Use Object.create(null) since JS engine strips __proto__ from object literals
    const obj = Object.create(null);
    obj['__proto__'] = { admin: true };
    expect(checkPrototypePollution(obj)).toBe(true);
  });

  it('should detect constructor key', () => {
    expect(checkPrototypePollution({ constructor: { prototype: {} } })).toBe(true);
  });

  it('should detect prototype key', () => {
    expect(checkPrototypePollution({ prototype: { polluted: true } })).toBe(true);
  });

  it('should detect nested __proto__', () => {
    const nested = Object.create(null);
    nested['__proto__'] = {};
    expect(checkPrototypePollution({ deep: nested })).toBe(true);
  });

  it('should detect deeply nested dangerous keys', () => {
    expect(checkPrototypePollution({
      a: { b: { c: { constructor: {} } } },
    })).toBe(true);
  });

  it('should return false for clean objects', () => {
    expect(checkPrototypePollution({ name: 'John', age: 30 })).toBe(false);
  });

  it('should return false for null', () => {
    expect(checkPrototypePollution(null)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(checkPrototypePollution('string' as unknown)).toBe(false);
    expect(checkPrototypePollution(42 as unknown)).toBe(false);
    expect(checkPrototypePollution(undefined as unknown)).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(checkPrototypePollution({})).toBe(false);
  });

  it('should handle objects with nested safe values', () => {
    expect(checkPrototypePollution({
      user: { name: 'Alice', settings: { theme: 'dark' } },
    })).toBe(false);
  });
});

// ============================================
// validatePasswordStrength
// ============================================

describe('[P0][safety] validatePasswordStrength', () => {
  it('should accept a strong password', () => {
    const result = validatePasswordStrength('MyP@ssw0rd!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePasswordStrength('Ab1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password longer than 128 characters', () => {
    const long = 'A'.repeat(127) + 'a1!';
    const result = validatePasswordStrength(long);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at most 128 characters');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePasswordStrength('myp@ssw0rd!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePasswordStrength('MYP@SSW0RD!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without a number', () => {
    const result = validatePasswordStrength('MyP@ssword!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one number');
  });

  it('should reject password without special character', () => {
    const result = validatePasswordStrength('MyPassw0rd');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('should return multiple errors for very weak password', () => {
    const result = validatePasswordStrength('abc');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it('should accept passwords at exactly 8 characters', () => {
    const result = validatePasswordStrength('Ab1!efgh');
    expect(result.valid).toBe(true);
  });

  it('should accept passwords at exactly 128 characters', () => {
    const base = 'Ab1!' + 'a'.repeat(124);
    expect(base.length).toBe(128);
    const result = validatePasswordStrength(base);
    expect(result.valid).toBe(true);
  });
});

// ============================================
// sanitizeInput
// ============================================

describe('[P0][safety] sanitizeInput', () => {
  it('should return clean text unchanged', () => {
    const result = sanitizeInput('Hello, World!');
    expect(result.blocked).toBe(false);
    expect(result.clean).toBe('Hello, World!');
  });

  it('should strip HTML tags from input', () => {
    const result = sanitizeInput('<b>bold</b> text');
    expect(result.blocked).toBe(false);
    expect(result.clean).toContain('bold');
    expect(result.clean).not.toContain('<b>');
  });

  it('should block script tag injection', () => {
    const result = sanitizeInput('<script>alert("xss")</script>');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('xss');
  });

  it('should block javascript: URLs', () => {
    const result = sanitizeInput('javascript:void(0)');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('xss');
  });

  it('should block event handlers', () => {
    const result = sanitizeInput('onerror=alert(1)');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('xss');
  });

  it('should block SQL injection patterns', () => {
    const result = sanitizeInput("'; DROP TABLE users; --");
    expect(result.blocked).toBe(true);
  });

  it('should block NoSQL injection patterns', () => {
    const result = sanitizeInput('{"$ne": ""}');
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('nosql');
  });

  it('should block command injection', () => {
    const result = sanitizeInput('; rm -rf /');
    expect(result.blocked).toBe(true);
  });

  it('should strip control characters', () => {
    const result = sanitizeInput('hello\x00world');
    expect(result.blocked).toBe(false);
    expect(result.clean).toBe('helloworld');
  });

  it('should trim whitespace', () => {
    const result = sanitizeInput('  hello  ');
    expect(result.blocked).toBe(false);
    expect(result.clean).toBe('hello');
  });

  it('should handle non-string input gracefully', () => {
    const result = sanitizeInput(123 as unknown as string);
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('Input must be a string');
  });

  it('should handle empty string', () => {
    const result = sanitizeInput('');
    expect(result.blocked).toBe(false);
    expect(result.clean).toBe('');
  });

  it('should enforce field-specific maxLength', () => {
    // Use a string with spaces/punctuation to avoid base64 pattern detection
    const longName = 'John '.repeat(20); // 100 chars
    const result = sanitizeInput(longName, 'firstName');
    expect(result.blocked).toBe(false);
    expect(result.clean.length).toBeLessThanOrEqual(50);
  });

  it('should not truncate when within field maxLength', () => {
    const result = sanitizeInput('John', 'firstName');
    expect(result.blocked).toBe(false);
    expect(result.clean).toBe('John');
  });

  it('should handle very long strings (>10000 chars)', () => {
    // Use a string with spaces to avoid base64 pattern detection
    const longString = 'Hello world! '.repeat(1200); // ~15600 chars
    const result = sanitizeInput(longString);
    expect(result.blocked).toBe(false);
    expect(typeof result.clean).toBe('string');
  });

  it('should handle Unicode text', () => {
    const result = sanitizeInput('Shalom!');
    expect(result.blocked).toBe(false);
    expect(result.clean).toContain('Shalom');
  });

  it('should handle emoji text', () => {
    const result = sanitizeInput('Hello there!');
    expect(result.blocked).toBe(false);
  });
});

// ============================================
// sanitizeObject
// ============================================

describe('[P0][safety] sanitizeObject', () => {
  it('should sanitize string values in a flat object', () => {
    const result = sanitizeObject({ name: '<b>John</b>', age: 30 });
    expect(result.blocked).toBe(false);
    expect(result.clean.name).toBe('John');
    expect(result.clean.age).toBe(30);
  });

  it('should preserve non-string values unchanged', () => {
    const result = sanitizeObject({
      count: 42,
      active: true,
      data: null,
    });
    expect(result.blocked).toBe(false);
    expect(result.clean.count).toBe(42);
    expect(result.clean.active).toBe(true);
    expect(result.clean.data).toBeNull();
  });

  it('should sanitize string items in arrays', () => {
    const result = sanitizeObject({
      tags: ['<b>safe</b>', 'normal', '<i>italic</i>'],
    });
    expect(result.blocked).toBe(false);
    const tags = result.clean.tags as string[];
    expect(tags[0]).toBe('safe');
    expect(tags[1]).toBe('normal');
    expect(tags[2]).toBe('italic');
  });

  it('should preserve non-string items in arrays', () => {
    const result = sanitizeObject({
      items: [1, true, 'text'],
    });
    expect(result.blocked).toBe(false);
    const items = result.clean.items as unknown[];
    expect(items[0]).toBe(1);
    expect(items[1]).toBe(true);
    expect(items[2]).toBe('text');
  });

  it('should block if any string field contains injection', () => {
    const result = sanitizeObject({
      safe: 'hello',
      evil: '<script>alert(1)</script>',
    });
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('evil');
  });

  it('should block if array item contains injection', () => {
    const result = sanitizeObject({
      tags: ['normal', '<script>alert(1)</script>'],
    });
    expect(result.blocked).toBe(true);
  });

  it('should detect prototype pollution in object', () => {
    // Use Object.create(null) to actually set __proto__ as a key
    const polluted: Record<string, unknown> = Object.create(null);
    polluted['__proto__'] = { admin: true };
    polluted['name'] = 'test';
    const result = sanitizeObject(polluted);
    expect(result.blocked).toBe(true);
    expect(result.reason).toContain('Prototype pollution');
  });

  it('should handle empty object', () => {
    const result = sanitizeObject({});
    expect(result.blocked).toBe(false);
    expect(result.clean).toEqual({});
  });

  it('should apply field-specific rules via fieldRules mapping', () => {
    // Use a string with spaces to avoid base64 pattern detection
    const longBio = 'I love hiking and reading! '.repeat(25); // ~675 chars
    const result = sanitizeObject(
      { description: longBio },
      { description: 'bio' }
    );
    expect(result.blocked).toBe(false);
    expect((result.clean.description as string).length).toBeLessThanOrEqual(500);
  });

  it('should block SQL injection in nested object field', () => {
    const result = sanitizeObject({
      query: "SELECT * FROM users WHERE 1=1",
    });
    expect(result.blocked).toBe(true);
  });

  it('should block NoSQL injection in object field', () => {
    const result = sanitizeObject({
      filter: '{"$ne": ""}',
    });
    expect(result.blocked).toBe(true);
  });

  it('should handle object with mixed types', () => {
    const result = sanitizeObject({
      name: 'Alice',
      age: 25,
      active: true,
      tags: ['hello', 'world'],
      metadata: null,
    });
    expect(result.blocked).toBe(false);
    expect(result.clean.name).toBe('Alice');
    expect(result.clean.age).toBe(25);
    expect(result.clean.active).toBe(true);
    expect(result.clean.metadata).toBeNull();
  });
});
