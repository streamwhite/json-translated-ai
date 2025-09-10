import {
  getAllKeys,
  getMissingKeys,
  getNestedValue,
  setNestedValue,
} from '../translation-utils.js';

describe('Translation Utils - Array Handling', () => {
  describe('Array Key Extraction', () => {
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
        booleans: [true, false, true],
      };

      const keys = getAllKeys(template);
      expect(keys).toContain('tags[0]');
      expect(keys).toContain('tags[1]');
      expect(keys).toContain('tags[2]');
      expect(keys).toContain('numbers[0]');
      expect(keys).toContain('numbers[4]');
      expect(keys).toContain('booleans[0]');
      expect(keys).toContain('booleans[2]');
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
      expect(keys).toContain('matrix[0][0]');
      expect(keys).toContain('matrix[0][1]');
      expect(keys).toContain('matrix[0][2]');
      expect(keys).toContain('matrix[1][0]');
      expect(keys).toContain('matrix[1][1]');
      expect(keys).toContain('matrix[1][2]');
      expect(keys).toContain('matrix[2][0]');
      expect(keys).toContain('matrix[2][1]');
      expect(keys).toContain('matrix[2][2]');
    });
  });

  describe('Array Value Access', () => {
    test('should access array elements by index', () => {
      const obj = {
        items: ['apple', 'banana', 'cherry'],
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };

      expect(getNestedValue(obj, 'items[0]')).toBe('apple');
      expect(getNestedValue(obj, 'items[1]')).toBe('banana');
      expect(getNestedValue(obj, 'items[2]')).toBe('cherry');
      expect(getNestedValue(obj, 'matrix[0][0]')).toBe(1);
      expect(getNestedValue(obj, 'matrix[1][1]')).toBe(4);
    });

    test('should handle out-of-bounds array access', () => {
      const obj = { items: ['a', 'b', 'c'] };

      expect(getNestedValue(obj, 'items[3]')).toBeUndefined();
      expect(getNestedValue(obj, 'items[-1]')).toBeUndefined();
      expect(getNestedValue(obj, 'items[999]')).toBeUndefined();
    });
  });

  describe('Array Value Setting', () => {
    test('should create arrays when setting array indices', () => {
      const obj = {};

      setNestedValue(obj, 'items[0]', 'first');
      expect(Array.isArray(obj.items)).toBe(true);
      expect(obj.items[0]).toBe('first');
      expect(obj.items).toHaveLength(1);
    });

    test('should extend existing arrays', () => {
      const obj = { items: ['existing'] };

      setNestedValue(obj, 'items[1]', 'second');
      expect(obj.items).toHaveLength(2);
      expect(obj.items[0]).toBe('existing');
      expect(obj.items[1]).toBe('second');
    });

    test('should handle deep array creation', () => {
      const obj = {};

      setNestedValue(obj, 'deep.nested.array[5]', 'value');
      expect(Array.isArray(obj.deep.nested.array)).toBe(true);
      expect(obj.deep.nested.array[5]).toBe('value');
      expect(obj.deep.nested.array).toHaveLength(6);
    });
  });

  describe('Array Missing Key Detection', () => {
    test('should detect missing array elements', () => {
      const template = {
        items: ['item1', 'item2', 'item3'],
      };

      const target = {
        items: ['item1'], // Missing items 1 and 2
      };

      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toContain('items[1]');
      expect(missingKeys).toContain('items[2]');
    });

    test('should handle arrays with different lengths', () => {
      const template = {
        navigation: ['Home', 'About', 'Contact', 'Services'],
      };

      const target = {
        navigation: ['Accueil', 'À propos'], // Only 2 items
      };

      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toContain('navigation[2]');
      expect(missingKeys).toContain('navigation[3]');
    });

    test('should detect missing nested array elements', () => {
      const template = {
        sections: [
          {
            title: 'Section 1',
            items: ['item1', 'item2'],
          },
          {
            title: 'Section 2',
            items: ['item3'],
          },
        ],
      };

      const target = {
        sections: [
          {
            title: 'Section 1',
            items: ['item1'], // Missing item2
          },
          // Missing entire second section
        ],
      };

      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toContain('sections[0].items[1]');
      expect(missingKeys).toContain('sections[1].title');
      expect(missingKeys).toContain('sections[1].items[0]');
    });
  });

  describe('Complex Array Scenarios', () => {
    test('should handle deeply nested array structures', () => {
      const template = {
        pages: [
          {
            sections: [
              {
                components: [
                  {
                    data: [{ key: 'value1' }, { key: 'value2' }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const keys = getAllKeys(template);
      expect(keys).toContain('pages[0].sections[0].components[0].data[0].key');
      expect(keys).toContain('pages[0].sections[0].components[0].data[1].key');
    });

    test('should handle array insertion in complex structures', () => {
      const obj = {};

      // Build complex nested structure with arrays
      setNestedValue(
        obj,
        'pages[0].sections[0].components[0].data[0].key',
        'value1'
      );
      setNestedValue(
        obj,
        'pages[0].sections[0].components[0].data[1].key',
        'value2'
      );
      setNestedValue(
        obj,
        'pages[0].sections[1].components[0].title',
        'Section Title'
      );

      expect(obj.pages[0].sections[0].components[0].data[0].key).toBe('value1');
      expect(obj.pages[0].sections[0].components[0].data[1].key).toBe('value2');
      expect(obj.pages[0].sections[1].components[0].title).toBe(
        'Section Title'
      );
    });

    test('should handle translation insertion for complex arrays', () => {
      const template = {
        navigation: [
          { label: 'Home', url: '/home' },
          { label: 'About', url: '/about' },
          { label: 'Contact', url: '/contact' },
        ],
      };

      const target = {};

      // Insert translations
      setNestedValue(target, 'navigation[0].label', 'Inicio');
      setNestedValue(target, 'navigation[0].url', '/home');
      setNestedValue(target, 'navigation[1].label', 'Acerca de');
      setNestedValue(target, 'navigation[1].url', '/about');
      setNestedValue(target, 'navigation[2].label', 'Contacto');
      setNestedValue(target, 'navigation[2].url', '/contact');

      // Verify structure
      expect(target.navigation[0].label).toBe('Inicio');
      expect(target.navigation[0].url).toBe('/home');
      expect(target.navigation[1].label).toBe('Acerca de');
      expect(target.navigation[1].url).toBe('/about');
      expect(target.navigation[2].label).toBe('Contacto');
      expect(target.navigation[2].url).toBe('/contact');

      // Verify no missing keys
      const missingKeys = getMissingKeys(template, target);
      expect(missingKeys).toHaveLength(0);
    });
  });
});
