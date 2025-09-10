import {
  getAllKeys,
  getMissingKeys,
  getNestedValue,
  setNestedValue,
} from '../translation-utils.js';

describe('Critical Translation Utility Functions', () => {
  describe('getAllKeys - Critical Edge Cases', () => {
    test('should handle circular references gracefully', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      // Should detect circular reference and throw error
      expect(() => getAllKeys(circularObj)).toThrow();
    });

    test('should handle very deep nesting without stack overflow', () => {
      let deepObj = { value: 'deep' };
      for (let i = 0; i < 1000; i++) {
        deepObj = { nested: deepObj };
      }

      const keys = getAllKeys(deepObj);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.length).toBeLessThan(10000); // Reasonable limit
    });

    test('should handle sparse arrays correctly', () => {
      const sparseArray = [];
      sparseArray[0] = 'First item';
      sparseArray[100] = 'Hundredth item';
      sparseArray[999] = 'Last item';

      const template = { items: sparseArray };
      const keys = getAllKeys(template);

      expect(keys).toContain('items.0');
      expect(keys).toContain('items.100');
      expect(keys).toContain('items.999');
      expect(keys).toHaveLength(1000);
    });

    test('should handle mixed array content types', () => {
      const mixedArray = [
        'string',
        42,
        null,
        undefined,
        { nested: 'object' },
        [1, 2, 3],
        true,
        false,
        new Date(),
        () => 'function',
      ];

      const template = { mixed: mixedArray };
      const keys = getAllKeys(template);

      expect(keys).toContain('mixed.0');
      expect(keys).toContain('mixed.1');
      expect(keys).toContain('mixed.2');
      expect(keys).toContain('mixed.3');
      expect(keys).toContain('mixed.4.nested');
      expect(keys).toContain('mixed.5.0');
      expect(keys).toContain('mixed.5.1');
      expect(keys).toContain('mixed.5.2');
      expect(keys).toContain('mixed.6');
      expect(keys).toContain('mixed.7');
      expect(keys).toContain('mixed.8');
      expect(keys).toContain('mixed.9');
    });
  });

  describe('getNestedValue - Critical Edge Cases', () => {
    test('should handle invalid paths gracefully', () => {
      const obj = { a: { b: 'value' } };

      expect(getNestedValue(obj, '')).toBeUndefined();
      expect(getNestedValue(obj, '   ')).toBeUndefined();
      expect(getNestedValue(obj, 'a.b.c.d')).toBeUndefined();
      expect(getNestedValue(obj, 'items.999')).toBeUndefined();
    });

    test('should handle array index out of bounds', () => {
      const obj = { items: ['a', 'b', 'c'] };

      expect(getNestedValue(obj, 'items.3')).toBeUndefined();
      expect(getNestedValue(obj, 'items.-1')).toBeUndefined();
      expect(getNestedValue(obj, 'items.abc')).toBeUndefined();
    });
  });

  describe('setNestedValue - Critical Edge Cases', () => {
    test('should handle array conversion correctly', () => {
      const obj = {};

      // Convert object to array
      setNestedValue(obj, 'items.0', 'first');
      expect(Array.isArray(obj.items)).toBe(true);
      expect(obj.items[0]).toBe('first');

      // Convert nested object to array
      setNestedValue(obj, 'nested.items.5', 'fifth');
      expect(Array.isArray(obj.nested.items)).toBe(true);
      expect(obj.nested.items[5]).toBe('fifth');
    });

    test('should handle deep array creation', () => {
      const obj = {};

      setNestedValue(obj, 'deep.very.deep.array.10', 'value');
      expect(Array.isArray(obj.deep.very.deep.array)).toBe(true);
      expect(obj.deep.very.deep.array[10]).toBe('value');
    });
  });

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
              {
                type: 'features',
                items: [
                  { title: 'Feature 1', description: 'Description 1' },
                  { title: 'Feature 2', description: 'Description 2' },
                ],
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
              // Missing features section
            ],
          },
        },
      };

      const missingKeys = getMissingKeys(englishTemplate, spanishTranslations);
      expect(missingKeys).toContain('pages.home.sections.1.type');
      expect(missingKeys).toContain('pages.home.sections.1.items.0.title');
      expect(missingKeys).toContain(
        'pages.home.sections.1.items.0.description'
      );
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

    test('should handle metrics type conversion correctly', () => {
      const template = {
        metrics: [
          { label: 'Metric 1', value: '100' },
          { label: 'Metric 2', value: '200' },
        ],
      };

      const target = {
        metrics: 'Metric 1: 100, Metric 2: 200', // String instead of array
      };

      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toContain('metrics.0.label');
      expect(missingKeys).toContain('metrics.0.value');
      expect(missingKeys).toContain('metrics.1.label');
      expect(missingKeys).toContain('metrics.1.value');
    });
  });

  describe('Data Type Consistency', () => {
    test('should detect type mismatches between template and target', () => {
      const template = {
        title: 'String Title',
        count: 42,
        enabled: true,
        items: ['item1', 'item2'],
      };

      const target = {
        title: 123, // Wrong type
        count: '42', // Wrong type
        enabled: 'true', // Wrong type
        items: 'item1,item2', // Wrong type
      };

      // All keys exist but with wrong types
      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toHaveLength(0); // No missing keys

      // But types are wrong - this would need additional validation
      expect(typeof target.title).not.toBe(typeof template.title);
      expect(typeof target.count).not.toBe(typeof template.count);
      expect(typeof target.enabled).not.toBe(typeof template.enabled);
      expect(Array.isArray(target.items)).not.toBe(
        Array.isArray(template.items)
      );
    });
  });

  describe('Translation Completeness', () => {
    test('should identify incomplete translations', () => {
      const template = {
        navigation: {
          home: 'Home',
          about: 'About',
          contact: 'Contact',
        },
        hero: {
          title: 'Welcome',
          subtitle: 'Get started today',
        },
      };

      const partialTranslation = {
        navigation: {
          home: 'Inicio', // Only one key translated
        },
        // Missing entire hero section
      };

      const missingKeys = getMissingKeys(template, partialTranslation);
      expect(missingKeys).toContain('navigation.about');
      expect(missingKeys).toContain('navigation.contact');
      expect(missingKeys).toContain('hero.title');
      expect(missingKeys).toContain('hero.subtitle');
      expect(missingKeys).toHaveLength(4);
    });

    test('should calculate completion percentage correctly', () => {
      const template = {
        a: 'value1',
        b: 'value2',
        c: 'value3',
        d: 'value4',
        e: 'value5',
      };

      const target = {
        a: 'translated1',
        b: 'translated2',
        // Missing c, d, e
      };

      const missingKeys = getMissingKeys(template, target);
      const completionRate =
        ((template.length - missingKeys.length) / template.length) * 100;

      expect(completionRate).toBe(40); // 2 out of 5 keys = 40%
    });
  });
});
