import {
  getAllKeys,
  getExtraKeys,
  getMissingKeys,
  getNestedValue,
  keyExists,
  setNestedValue,
} from '../translation-utils.js';

// Mock data for testing
const mockEnglishTemplate = {
  navigation: {
    home: 'Home',
    services: 'Services',
    contact: 'Contact',
    about: 'About Us',
  },
  hero: {
    title: 'Professional Web Development',
    subtitle: 'We create amazing websites',
    cta: 'Get Started',
  },
  services: {
    frontend: {
      title: 'Frontend Development',
      description: 'Modern React and Next.js applications',
    },
    backend: {
      title: 'Backend Development',
      description: 'Scalable API development',
    },
  },
  footer: {
    copyright: '© 2024 All rights reserved',
    links: ['Privacy Policy', 'Terms of Service'],
  },
  structuredData: {
    metrics: [
      {
        label: 'Projects Completed',
        value: '100+',
      },
      {
        label: 'Happy Clients',
        value: '50+',
      },
    ],
  },
};

const mockSpanishTranslations = {
  navigation: {
    home: 'Inicio',
    services: 'Servicios',
    contact: 'Contacto',
    // Missing 'about' key
  },
  hero: {
    title: 'Desarrollo Web Profesional',
    subtitle: 'Creamos sitios web increíbles',
    // Missing 'cta' key
  },
  services: {
    frontend: {
      title: 'Desarrollo Frontend',
      description: 'Aplicaciones modernas de React y Next.js',
    },
    // Missing 'backend' key
  },
  // Missing 'footer' and 'structuredData' keys
};

const mockFrenchTranslations = {
  navigation: {
    home: 'Accueil',
    services: 'Services',
    contact: 'Contact',
    about: 'À propos',
  },
  hero: {
    title: 'Développement Web Professionnel',
    subtitle: 'Nous créons des sites web incroyables',
    cta: 'Commencer',
  },
  services: {
    frontend: {
      title: 'Développement Frontend',
      description: 'Applications modernes React et Next.js',
    },
    backend: {
      title: 'Développement Backend',
      description: "Développement d'API évolutif",
    },
  },
  footer: {
    copyright: '© 2024 Tous droits réservés',
    links: ['Politique de confidentialité', "Conditions d'utilisation"],
  },
  structuredData: {
    metrics: [
      {
        label: 'Projets Terminés',
        value: '100+',
      },
      {
        label: 'Clients Satisfaits',
        value: '50+',
      },
    ],
  },
};

describe('Translation Insertion Functions', () => {
  describe('getAllKeys', () => {
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
        'items[0].name',
        'items[0].value',
        'items[1].name',
        'items[1].value',
        'simple',
      ]);
    });

    test('should extract all keys from real English template', () => {
      const keys = getAllKeys(mockEnglishTemplate);

      expect(keys).toContain('navigation.home');
      expect(keys).toContain('navigation.services');
      expect(keys).toContain('navigation.contact');
      expect(keys).toContain('navigation.about');
      expect(keys).toContain('hero.title');
      expect(keys).toContain('hero.subtitle');
      expect(keys).toContain('hero.cta');
      expect(keys).toContain('services.frontend.title');
      expect(keys).toContain('services.frontend.description');
      expect(keys).toContain('services.backend.title');
      expect(keys).toContain('services.backend.description');
      expect(keys).toContain('footer.copyright');
      expect(keys).toContain('footer.links[0]');
      expect(keys).toContain('footer.links[1]');
      expect(keys).toContain('structuredData.metrics[0].label');
      expect(keys).toContain('structuredData.metrics[0].value');
      expect(keys).toContain('structuredData.metrics[1].label');
      expect(keys).toContain('structuredData.metrics[1].value');

      expect(keys).toHaveLength(18);
    });
  });

  describe('getNestedValue', () => {
    test('should get simple nested value', () => {
      const value = getNestedValue(mockEnglishTemplate, 'navigation.home');
      expect(value).toBe('Home');
    });

    test('should get deeply nested value', () => {
      const value = getNestedValue(
        mockEnglishTemplate,
        'services.frontend.title'
      );
      expect(value).toBe('Frontend Development');
    });

    test('should get array element value', () => {
      const value = getNestedValue(mockEnglishTemplate, 'footer.links[0]');
      expect(value).toBe('Privacy Policy');
    });

    test('should get nested array element value', () => {
      const value = getNestedValue(
        mockEnglishTemplate,
        'structuredData.metrics.0.label'
      );
      expect(value).toBe('Projects Completed');
    });

    test('should return undefined for non-existent key', () => {
      const value = getNestedValue(
        mockEnglishTemplate,
        'navigation.nonexistent'
      );
      expect(value).toBeUndefined();
    });

    test('should return undefined for invalid array index', () => {
      const value = getNestedValue(mockEnglishTemplate, 'footer.links[999]');
      expect(value).toBeUndefined();
    });
  });

  describe('setNestedValue', () => {
    test('should set simple nested value', () => {
      const obj = {};
      setNestedValue(obj, 'navigation.home', 'Inicio');

      expect(obj.navigation.home).toBe('Inicio');
    });

    test('should set deeply nested value', () => {
      const obj = {};
      setNestedValue(obj, 'services.frontend.title', 'Desarrollo Frontend');

      expect(obj.services.frontend.title).toBe('Desarrollo Frontend');
    });

    test('should set array element value', () => {
      const obj = {};
      setNestedValue(obj, 'footer.links[0]', 'Política de Privacidad');

      expect(obj.footer.links[0]).toBe('Política de Privacidad');
    });

    test('should set nested array element value', () => {
      const obj = {};
      setNestedValue(
        obj,
        'structuredData.metrics[0].label',
        'Proyectos Completados'
      );

      expect(obj.structuredData.metrics[0].label).toBe('Proyectos Completados');
    });

    test('should update existing value', () => {
      const obj = { navigation: { home: 'Old Value' } };
      setNestedValue(obj, 'navigation.home', 'New Value');

      expect(obj.navigation.home).toBe('New Value');
    });

    test('should create nested structure if it does not exist', () => {
      const obj = {};
      setNestedValue(obj, 'deeply.nested.structure.value', 'Test');

      expect(obj.deeply.nested.structure.value).toBe('Test');
    });

    test('should handle multiple array elements', () => {
      const obj = {};
      setNestedValue(obj, 'items[0].name', 'Item 1');
      setNestedValue(obj, 'items[1].name', 'Item 2');

      expect(obj.items[0].name).toBe('Item 1');
      expect(obj.items[1].name).toBe('Item 2');
      expect(obj.items).toHaveLength(2);
    });
  });

  describe('keyExists', () => {
    test('should return true for existing key', () => {
      expect(keyExists(mockEnglishTemplate, 'navigation.home')).toBe(true);
    });

    test('should return true for existing nested key', () => {
      expect(keyExists(mockEnglishTemplate, 'services.frontend.title')).toBe(
        true
      );
    });

    test('should return true for existing array key', () => {
      expect(keyExists(mockEnglishTemplate, 'footer.links[0]')).toBe(true);
    });

    test('should return false for non-existent key', () => {
      expect(keyExists(mockEnglishTemplate, 'navigation.nonexistent')).toBe(
        false
      );
    });

    test('should return false for non-existent nested key', () => {
      expect(keyExists(mockEnglishTemplate, 'services.nonexistent.title')).toBe(
        false
      );
    });
  });

  describe('getMissingKeys', () => {
    test('should find missing keys in Spanish translations', () => {
      const missingKeys = getMissingKeys(
        mockEnglishTemplate,
        mockSpanishTranslations
      );

      expect(missingKeys).toContain('navigation.about');
      expect(missingKeys).toContain('hero.cta');
      expect(missingKeys).toContain('services.backend.title');
      expect(missingKeys).toContain('services.backend.description');
      expect(missingKeys).toContain('footer.copyright');
      expect(missingKeys).toContain('footer.links[0]');
      expect(missingKeys).toContain('footer.links[1]');
      expect(missingKeys).toContain('structuredData.metrics[0].label');
      expect(missingKeys).toContain('structuredData.metrics[0].value');
      expect(missingKeys).toContain('structuredData.metrics[1].label');
      expect(missingKeys).toContain('structuredData.metrics[1].value');

      expect(missingKeys).toHaveLength(11);
    });

    test('should find no missing keys in complete French translations', () => {
      const missingKeys = getMissingKeys(
        mockEnglishTemplate,
        mockFrenchTranslations
      );
      expect(missingKeys).toHaveLength(0);
    });

    test('should find all keys missing in empty object', () => {
      const missingKeys = getMissingKeys(mockEnglishTemplate, {});
      const allKeys = getAllKeys(mockEnglishTemplate);

      expect(missingKeys).toEqual(allKeys);
    });
  });

  describe('getExtraKeys', () => {
    test('should find extra keys in target that are not in template', () => {
      const targetWithExtra = {
        ...mockSpanishTranslations,
        extra: {
          key1: 'value1',
          key2: 'value2',
        },
        navigation: {
          ...mockSpanishTranslations.navigation,
          extraNav: 'Extra Navigation',
        },
      };

      const extraKeys = getExtraKeys(mockEnglishTemplate, targetWithExtra);

      expect(extraKeys).toContain('extra.key1');
      expect(extraKeys).toContain('extra.key2');
      expect(extraKeys).toContain('navigation.extraNav');
    });

    test('should find no extra keys when target is subset of template', () => {
      const extraKeys = getExtraKeys(
        mockEnglishTemplate,
        mockSpanishTranslations
      );
      expect(extraKeys).toHaveLength(0);
    });
  });

  describe('Translation Insertion Integration', () => {
    test('should correctly insert missing translations into language object', () => {
      const targetLang = { ...mockSpanishTranslations };
      const missingKeys = getMissingKeys(mockEnglishTemplate, targetLang);

      // Simulate translated values for missing keys
      const translatedValues = {
        'navigation.about': 'Acerca de',
        'hero.cta': 'Comenzar',
        'services.backend.title': 'Desarrollo Backend',
        'services.backend.description': 'Desarrollo de API escalable',
        'footer.copyright': '© 2024 Todos los derechos reservados',
        'footer.links[0]': 'Política de Privacidad',
        'footer.links[1]': 'Términos de Servicio',
        'structuredData.metrics[0].label': 'Proyectos Completados',
        'structuredData.metrics[0].value': '100+',
        'structuredData.metrics[1].label': 'Clientes Satisfechos',
        'structuredData.metrics[1].value': '50+',
      };

      // Insert each missing translation
      missingKeys.forEach((key) => {
        const translatedValue = translatedValues[key];
        setNestedValue(targetLang, key, translatedValue);
      });

      // Verify all keys now exist
      missingKeys.forEach((key) => {
        expect(keyExists(targetLang, key)).toBe(true);
      });

      // Verify specific values were inserted correctly
      expect(targetLang.navigation.about).toBe('Acerca de');
      expect(targetLang.hero.cta).toBe('Comenzar');
      expect(targetLang.services.backend.title).toBe('Desarrollo Backend');
      expect(targetLang.footer.links[0]).toBe('Política de Privacidad');
      expect(targetLang.structuredData.metrics[0].label).toBe(
        'Proyectos Completados'
      );

      // Verify no missing keys remain
      const remainingMissing = getMissingKeys(mockEnglishTemplate, targetLang);
      expect(remainingMissing).toHaveLength(0);
    });

    test('should handle array insertion correctly', () => {
      const targetLang = {};

      // Insert array elements
      setNestedValue(targetLang, 'footer.links[0]', 'Privacy Policy');
      setNestedValue(targetLang, 'footer.links[1]', 'Terms of Service');

      expect(targetLang.footer.links).toHaveLength(2);
      expect(targetLang.footer.links[0]).toBe('Privacy Policy');
      expect(targetLang.footer.links[1]).toBe('Terms of Service');
    });

    test('should handle nested array insertion correctly', () => {
      const targetLang = {};

      // Insert nested array elements
      setNestedValue(
        targetLang,
        'structuredData.metrics[0].label',
        'Projects Completed'
      );
      setNestedValue(targetLang, 'structuredData.metrics[0].value', '100+');
      setNestedValue(
        targetLang,
        'structuredData.metrics.1.label',
        'Happy Clients'
      );
      setNestedValue(targetLang, 'structuredData.metrics[1].value', '50+');

      expect(targetLang.structuredData.metrics).toHaveLength(2);
      expect(targetLang.structuredData.metrics[0].label).toBe(
        'Projects Completed'
      );
      expect(targetLang.structuredData.metrics[0].value).toBe('100+');
      expect(targetLang.structuredData.metrics[1].label).toBe('Happy Clients');
      expect(targetLang.structuredData.metrics[1].value).toBe('50+');
    });

    test('should preserve existing translations when inserting new ones', () => {
      const targetLang = { ...mockSpanishTranslations };

      // Verify existing translations are preserved
      expect(targetLang.navigation.home).toBe('Inicio');
      expect(targetLang.hero.title).toBe('Desarrollo Web Profesional');

      // Insert new translations
      setNestedValue(targetLang, 'navigation.about', 'Acerca de');
      setNestedValue(targetLang, 'hero.cta', 'Comenzar');

      // Verify existing translations are still there
      expect(targetLang.navigation.home).toBe('Inicio');
      expect(targetLang.hero.title).toBe('Desarrollo Web Profesional');

      // Verify new translations were added
      expect(targetLang.navigation.about).toBe('Acerca de');
      expect(targetLang.hero.cta).toBe('Comenzar');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle complex nested structure with mixed arrays and objects', () => {
      const complexTemplate = {
        page: {
          sections: [
            {
              type: 'hero',
              content: {
                title: 'Welcome',
                subtitle: 'Get started today',
                buttons: ['Learn More', 'Sign Up'],
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
          metadata: {
            title: 'Page Title',
            description: 'Page Description',
          },
        },
      };

      const keys = getAllKeys(complexTemplate);

      expect(keys).toContain('page.sections[0].type');
      expect(keys).toContain('page.sections[0].content.title');
      expect(keys).toContain('page.sections[0].content.subtitle');
      expect(keys).toContain('page.sections[0].content.buttons[0]');
      expect(keys).toContain('page.sections[0].content.buttons[1]');
      expect(keys).toContain('page.sections[1].type');
      expect(keys).toContain('page.sections[1].items[0].title');
      expect(keys).toContain('page.sections[1].items[0].description');
      expect(keys).toContain('page.sections[1].items[1].title');
      expect(keys).toContain('page.sections[1].items[1].description');
      expect(keys).toContain('page.metadata.title');
      expect(keys).toContain('page.metadata.description');
    });

    test('should handle translation insertion for complex structure', () => {
      const complexTemplate = {
        page: {
          sections: [
            {
              type: 'hero',
              content: {
                title: 'Welcome',
                subtitle: 'Get started today',
                buttons: ['Learn More', 'Sign Up'],
              },
            },
          ],
        },
      };

      const targetLang = {};

      // Insert translations
      setNestedValue(targetLang, 'page.sections[0].type', 'hero');
      setNestedValue(
        targetLang,
        'page.sections[0].content.title',
        'Bienvenido'
      );
      setNestedValue(
        targetLang,
        'page.sections[0].content.subtitle',
        'Comienza hoy'
      );
      setNestedValue(
        targetLang,
        'page.sections[0].content.buttons[0]',
        'Aprende Más'
      );
      setNestedValue(
        targetLang,
        'page.sections[0].content.buttons[1]',
        'Regístrate'
      );

      // Verify structure
      expect(targetLang.page.sections[0].type).toBe('hero');
      expect(targetLang.page.sections[0].content.title).toBe('Bienvenido');
      expect(targetLang.page.sections[0].content.subtitle).toBe('Comienza hoy');
      expect(targetLang.page.sections[0].content.buttons[0]).toBe(
        'Aprende Más'
      );
      expect(targetLang.page.sections[0].content.buttons[1]).toBe('Regístrate');

      // Verify no missing keys
      const missingKeys = getMissingKeys(complexTemplate, targetLang);
      expect(missingKeys).toHaveLength(0);
    });
  });
});
