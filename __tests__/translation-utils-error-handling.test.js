import {
  getAllKeys,
  getNestedValue,
  keyExists,
  setNestedValue,
} from '../translation-utils.js';

describe('Translation Utils - Error Handling and Validation', () => {
  describe('Input Validation', () => {
    test('should handle null input gracefully', () => {
      expect(() => getAllKeys(null)).toThrow();
      expect(() => getNestedValue(null, 'path')).toThrow();
      expect(() => setNestedValue(null, 'path', 'value')).toThrow();
      expect(() => keyExists(null, 'path')).toThrow();
    });

    test('should handle undefined input gracefully', () => {
      expect(() => getAllKeys(undefined)).toThrow();
      expect(() => getNestedValue(undefined, 'path')).toThrow();
      expect(() => setNestedValue(undefined, 'path', 'value')).toThrow();
      expect(() => keyExists(undefined, 'path')).toThrow();
    });

    test('should handle primitive types gracefully', () => {
      expect(() => getAllKeys('string')).toThrow();
      expect(() => getAllKeys(42)).toThrow();
      expect(() => getAllKeys(true)).toThrow();
      expect(() => getAllKeys(Symbol('test'))).toThrow();
    });

    test('should handle functions gracefully', () => {
      const func = () => 'test';
      expect(() => getAllKeys(func)).toThrow();
    });
  });

  describe('Path Validation', () => {
    test('should handle empty paths', () => {
      const obj = { test: 'value' };

      expect(getNestedValue(obj, '')).toBeUndefined();
      expect(getNestedValue(obj, '   ')).toBeUndefined();
      expect(getNestedValue(obj, '\t\n')).toBeUndefined();
    });

    test('should handle invalid path formats', () => {
      const obj = { test: 'value' };

      expect(getNestedValue(obj, 'invalid..path')).toBeUndefined();
      expect(getNestedValue(obj, '.leading.dot')).toBeUndefined();
      expect(getNestedValue(obj, 'trailing.dot.')).toBeUndefined();
    });

    test('should handle paths with special characters', () => {
      const obj = {
        'special-key': 'value1',
        'key.with.dots': 'value2',
        'key with spaces': 'value3',
        'key-with_underscores': 'value4',
      };

      // These should work as expected
      expect(getNestedValue(obj, 'special-key')).toBe('value1');
      expect(getNestedValue(obj, 'key.with.dots')).toBe('value2');
      expect(getNestedValue(obj, 'key with spaces')).toBe('value3');
      expect(getNestedValue(obj, 'key-with_underscores')).toBe('value4');
    });
  });

  describe('Array Index Validation', () => {
    test('should handle invalid array indices', () => {
      const obj = { items: ['a', 'b', 'c'] };

      expect(getNestedValue(obj, 'items.abc')).toBeUndefined();
      expect(getNestedValue(obj, 'items.1.5')).toBeUndefined();
      expect(getNestedValue(obj, 'items.-1')).toBeUndefined();
      expect(getNestedValue(obj, 'items.3.14')).toBeUndefined();
    });

    test('should handle non-array access with numeric keys', () => {
      const obj = { items: 'not an array' };

      expect(getNestedValue(obj, 'items.0')).toBeUndefined();
      expect(getNestedValue(obj, 'items.1')).toBeUndefined();
    });
  });

  describe('Circular Reference Detection', () => {
    test('should detect simple circular references', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => getAllKeys(circularObj)).toThrow();
    });

    test('should detect nested circular references', () => {
      const obj = { level1: { level2: {} } };
      obj.level1.level2.circular = obj.level1;

      expect(() => getAllKeys(obj)).toThrow();
    });

    test('should detect circular references in arrays', () => {
      const obj = { items: [] };
      obj.items.push(obj);

      expect(() => getAllKeys(obj)).toThrow();
    });
  });

  describe('Deep Nesting Protection', () => {
    test('should handle very deep nesting without stack overflow', () => {
      let deepObj = { value: 'deep' };
      for (let i = 0; i < 1000; i++) {
        deepObj = { nested: deepObj };
      }

      const keys = getAllKeys(deepObj);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.length).toBeLessThan(10000); // Reasonable limit
    });

    test('should handle deep array nesting', () => {
      let deepArray = ['deep'];
      for (let i = 0; i < 100; i++) {
        deepArray = [deepArray];
      }

      const template = { items: deepArray };
      const keys = getAllKeys(template);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance Protection', () => {
    test('should handle large objects efficiently', () => {
      const largeObj = {};

      // Create a large object with many keys
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = {
          title: `Title ${i}`,
          description: `Description ${i}`,
          items: Array.from({ length: 10 }, (_, j) => `item${i}-${j}`),
        };
      }

      const startTime = Date.now();
      const keys = getAllKeys(largeObj);
      const endTime = Date.now();

      expect(keys.length).toBeGreaterThan(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    test('should handle sparse arrays efficiently', () => {
      const sparseArray = [];
      sparseArray[0] = 'first';
      sparseArray[1000] = 'thousandth';
      sparseArray[10000] = 'ten thousandth';

      const template = { items: sparseArray };
      const startTime = Date.now();
      const keys = getAllKeys(template);
      const endTime = Date.now();

      expect(keys.length).toBe(10001);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('Edge Case Handling', () => {
    test('should handle objects with getter/setter properties', () => {
      const obj = {};
      let value = 'initial';

      Object.defineProperty(obj, 'dynamic', {
        get: () => value,
        set: (newValue) => {
          value = newValue;
        },
        enumerable: true,
        configurable: true,
      });

      const keys = getAllKeys(obj);
      expect(keys).toContain('dynamic');
    });

    test('should handle objects with non-enumerable properties', () => {
      const obj = { visible: 'visible' };
      Object.defineProperty(obj, 'hidden', {
        value: 'hidden',
        enumerable: false,
      });

      const keys = getAllKeys(obj);
      expect(keys).toContain('visible');
      expect(keys).not.toContain('hidden');
    });

    test('should handle objects with symbol keys', () => {
      const symbol = Symbol('test');
      const obj = { [symbol]: 'symbol value', regular: 'regular value' };

      const keys = getAllKeys(obj);
      expect(keys).toContain('regular');
      // Symbol keys should be handled appropriately
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('Function Safety', () => {
    test('should handle setNestedValue with invalid paths safely', () => {
      const obj = {};

      // These should not throw errors
      expect(() => setNestedValue(obj, '', 'value')).not.toThrow();
      expect(() => setNestedValue(obj, '   ', 'value')).not.toThrow();
      expect(() => setNestedValue(obj, 'valid.path', 'value')).not.toThrow();
    });

    test('should handle getNestedValue with invalid paths safely', () => {
      const obj = { valid: 'value' };

      // These should return undefined instead of throwing
      expect(getNestedValue(obj, '')).toBeUndefined();
      expect(getNestedValue(obj, '   ')).toBeUndefined();
      expect(getNestedValue(obj, 'invalid.path')).toBeUndefined();
    });

    test('should handle keyExists with invalid paths safely', () => {
      const obj = { valid: 'value' };

      // These should return false instead of throwing
      expect(keyExists(obj, '')).toBe(false);
      expect(keyExists(obj, '   ')).toBe(false);
      expect(keyExists(obj, 'invalid.path')).toBe(false);
    });
  });

  describe('Data Integrity Protection', () => {
    test('should not modify original objects when reading', () => {
      const original = { a: { b: 'value' } };
      const copy = JSON.parse(JSON.stringify(original));

      getNestedValue(original, 'a.b');
      getAllKeys(original);
      keyExists(original, 'a.b');

      expect(original).toEqual(copy);
    });

    test('should handle concurrent access safely', () => {
      const obj = { items: ['a', 'b', 'c'] };

      // Simulate concurrent access
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(getNestedValue(obj, `items.${i % 3}`));
      }

      expect(results.every((result) => ['a', 'b', 'c'].includes(result))).toBe(
        true
      );
    });
  });
});
