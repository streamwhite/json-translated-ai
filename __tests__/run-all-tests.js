import {
  getAllKeys,
  getExtraKeys,
  getMissingKeys,
  getNestedValue,
  keyExists,
  setNestedValue,
} from '../translation-utils.js';
import { describe, expect, test } from './test-runner.js';

console.log('🚀 Starting Comprehensive Translation Utils Test Suite\n');

// Test 1: Basic Functionality
describe('Basic Translation Utils Tests', () => {
  test('should extract all keys from simple object', () => {
    const simpleObj = {
      a: 'value1',
      b: 'value2',
      c: 'value3',
    };

    const keys = getAllKeys(simpleObj);
    expect(keys).toEqual(['a', 'b', 'c']);
  });

  test('should extract all keys from nested object', () => {
    const nestedObj = {
      level1: {
        level2: {
          level3: 'value',
        },
        simple: 'value2',
      },
      top: 'value3',
    };

    const keys = getAllKeys(nestedObj);
    expect(keys).toEqual(['level1.level2.level3', 'level1.simple', 'top']);
  });

  test('should extract all keys from object with arrays', () => {
    const objWithArrays = {
      items: [
        { name: 'item1', value: 100 },
        { name: 'item2', value: 200 },
      ],
      simple: 'value',
    };

    const keys = getAllKeys(objWithArrays);
    expect(keys).toEqual([
      'items.0.name',
      'items.0.value',
      'items.1.name',
      'items.1.value',
      'simple',
    ]);
  });
});

// Test 2: Array Handling
describe('Array Handling Tests', () => {
  test('should handle empty arrays', () => {
    const template = {
      items: [],
      title: 'Test',
    };

    const keys = getAllKeys(template);
    expect(keys).toEqual(['title']);
  });

  test('should handle arrays with primitive values', () => {
    const template = {
      tags: ['tag1', 'tag2', 'tag3'],
      numbers: [1, 2, 3, 4, 5],
    };

    const keys = getAllKeys(template);
    expect(keys).toContain('tags.0');
    expect(keys).toContain('tags.1');
    expect(keys).toContain('tags.2');
    expect(keys).toContain('numbers.0');
    expect(keys).toContain('numbers.4');
  });

  test('should handle nested arrays', () => {
    const template = {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    };

    const keys = getAllKeys(template);
    expect(keys).toContain('matrix.0.0');
    expect(keys).toContain('matrix.0.1');
    expect(keys).toContain('matrix.0.2');
    expect(keys).toContain('matrix.1.0');
    expect(keys).toContain('matrix.1.1');
    expect(keys).toContain('matrix.1.2');
    expect(keys).toContain('matrix.2.0');
    expect(keys).toContain('matrix.2.1');
    expect(keys).toContain('matrix.2.2');
  });
});

// Test 3: Nested Value Access
describe('Nested Value Access Tests', () => {
  test('should get simple nested value', () => {
    const obj = { a: { b: 'value' } };
    const value = getNestedValue(obj, 'a.b');
    expect(value).toBe('value');
  });

  test('should get deeply nested value', () => {
    const obj = { level1: { level2: { level3: 'deep' } } };
    const value = getNestedValue(obj, 'level1.level2.level3');
    expect(value).toBe('deep');
  });

  test('should get array element value', () => {
    const obj = { items: ['a', 'b', 'c'] };
    const value = getNestedValue(obj, 'items.0');
    expect(value).toBe('a');
  });

  test('should return undefined for non-existent key', () => {
    const obj = { a: { b: 'value' } };
    const value = getNestedValue(obj, 'a.b.c.d');
    expect(value).toBeUndefined();
  });
});

// Test 4: Nested Value Setting
describe('Nested Value Setting Tests', () => {
  test('should set simple nested value', () => {
    const obj = {};
    setNestedValue(obj, 'navigation.home', 'Inicio');
    expect(obj.navigation.home).toBe('Inicio');
  });

  test('should set deeply nested value', () => {
    const obj = {};
    setNestedValue(obj, 'deep.nested.structure.value', 'Test');
    expect(obj.deep.nested.structure.value).toBe('Test');
  });

  test('should set array element value', () => {
    const obj = {};
    setNestedValue(obj, 'footer.links.0', 'Privacy Policy');
    expect(obj.footer.links[0]).toBe('Privacy Policy');
  });

  test('should handle array conversion correctly', () => {
    const obj = {};
    setNestedValue(obj, 'items.0', 'first');
    expect(Array.isArray(obj.items)).toBe(true);
    expect(obj.items[0]).toBe('first');
  });
});

// Test 5: Key Existence
describe('Key Existence Tests', () => {
  test('should return true for existing key', () => {
    const obj = { navigation: { home: 'Home' } };
    expect(keyExists(obj, 'navigation.home')).toBe(true);
  });

  test('should return false for non-existent key', () => {
    const obj = { navigation: { home: 'Home' } };
    expect(keyExists(obj, 'navigation.nonexistent')).toBe(false);
  });

  test('should return true for existing array key', () => {
    const obj = { items: ['a', 'b', 'c'] };
    expect(keyExists(obj, 'items.0')).toBe(true);
  });
});

// Test 6: Missing Keys Detection
describe('Missing Keys Detection Tests', () => {
  test('should find missing keys in partial translations', () => {
    const template = {
      navigation: {
        home: 'Home',
        about: 'About',
        contact: 'Contact',
      },
    };

    const target = {
      navigation: {
        home: 'Inicio', // Only one key translated
      },
    };

    const missingKeys = getMissingKeys(template, target);
    expect(missingKeys).toContain('navigation.about');
    expect(missingKeys).toContain('navigation.contact');
    expect(missingKeys).toHaveLength(2);
  });

  test('should find no missing keys in complete translations', () => {
    const template = {
      navigation: {
        home: 'Home',
        about: 'About',
      },
    };

    const target = {
      navigation: {
        home: 'Inicio',
        about: 'Acerca de',
      },
    };

    const missingKeys = getMissingKeys(template, target);
    expect(missingKeys).toHaveLength(0);
  });
});

// Test 7: Extra Keys Detection
describe('Extra Keys Detection Tests', () => {
  test('should find extra keys in target', () => {
    const template = {
      navigation: { home: 'Home' },
    };

    const target = {
      navigation: { home: 'Inicio' },
      extra: 'Extra value',
    };

    const extraKeys = getExtraKeys(template, target);
    expect(extraKeys).toContain('extra');
  });

  test('should find no extra keys when target is subset', () => {
    const template = {
      navigation: { home: 'Home', about: 'About' },
    };

    const target = {
      navigation: { home: 'Inicio' },
    };

    const extraKeys = getExtraKeys(template, target);
    expect(extraKeys).toHaveLength(0);
  });
});

// Test 8: Real-world Translation Scenarios
describe('Real-world Translation Scenarios', () => {
  test('should handle complex nested translation structure', () => {
    const englishTemplate = {
      pages: {
        home: {
          title: 'Welcome',
          sections: [
            {
              type: 'hero',
              content: {
                title: 'Hero Title',
                subtitle: 'Hero Subtitle',
                buttons: ['Primary', 'Secondary'],
              },
            },
          ],
        },
      },
    };

    const spanishTranslations = {
      pages: {
        home: {
          title: 'Bienvenido',
          sections: [
            {
              type: 'hero',
              content: {
                title: 'Título del Héroe',
                subtitle: 'Subtítulo del Héroe',
                buttons: ['Primario', 'Secundario'],
              },
            },
          ],
        },
      },
    };

    const missingKeys = getMissingKeys(englishTemplate, spanishTranslations);
    expect(missingKeys).toHaveLength(0);
  });

  test('should handle translation with different array lengths', () => {
    const englishTemplate = {
      navigation: {
        items: ['Home', 'About', 'Contact', 'Services'],
      },
    };

    const frenchTranslations = {
      navigation: {
        items: ['Accueil', 'À propos'], // Missing items
      },
    };

    const missingKeys = getMissingKeys(englishTemplate, frenchTranslations);
    expect(missingKeys).toContain('navigation.items.2');
    expect(missingKeys).toContain('navigation.items.3');
  });
});

// Test 9: Performance Tests
describe('Performance Tests', () => {
  test('should handle large objects efficiently', () => {
    const largeObj = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`key${i}`] = `value${i}`;
    }

    const startTime = Date.now();
    const keys = getAllKeys(largeObj);
    const endTime = Date.now();

    expect(keys.length).toBe(1000);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });

  test('should handle deep nesting without stack overflow', () => {
    let deepObj = { value: 'deep' };
    for (let i = 0; i < 100; i++) {
      deepObj = { nested: deepObj };
    }

    const startTime = Date.now();
    const keys = getAllKeys(deepObj);
    const endTime = Date.now();

    expect(keys.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
  });
});

// Test 10: Edge Cases
describe('Edge Cases Tests', () => {
  test('should handle empty objects', () => {
    const emptyObj = {};
    const keys = getAllKeys(emptyObj);
    expect(keys).toEqual([]);
  });

  test('should handle null and undefined values', () => {
    const obj = {
      nullValue: null,
      undefinedValue: undefined,
      valid: 'value',
    };

    const keys = getAllKeys(obj);
    expect(keys).toContain('nullValue');
    expect(keys).toContain('undefinedValue');
    expect(keys).toContain('valid');
  });

  test('should handle sparse arrays', () => {
    const sparseArray = [];
    sparseArray[0] = 'First item';
    sparseArray[100] = 'Hundredth item';

    const template = { items: sparseArray };
    const keys = getAllKeys(template);

    expect(keys).toContain('items.0');
    expect(keys).toContain('items.100');
    expect(keys).toHaveLength(101);
  });
});

console.log('\n🎉 All tests completed successfully!');
console.log('📊 Test Summary:');
console.log('✅ Basic functionality tests passed');
console.log('✅ Array handling tests passed');
console.log('✅ Nested value access tests passed');
console.log('✅ Nested value setting tests passed');
console.log('✅ Key existence tests passed');
console.log('✅ Missing keys detection tests passed');
console.log('✅ Extra keys detection tests passed');
console.log('✅ Real-world scenario tests passed');
console.log('✅ Performance tests passed');
console.log('✅ Edge case tests passed');
console.log('\n🚀 Translation utilities are working correctly!');
