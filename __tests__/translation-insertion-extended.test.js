import {
  getAllKeys,
  getMissingKeys,
  keyExists,
  setNestedValue,
} from '../translation-utils.js';

// Extended mock data for comprehensive testing
const mockEnglishTemplate = {
  navigation: {
    home: 'Home',
    services: 'Services',
    contact: 'Contact',
    about: 'About Us',
    blog: 'Blog',
    portfolio: 'Portfolio',
  },
  hero: {
    title: 'Professional Web Development',
    subtitle: 'We create amazing websites',
    cta: 'Get Started',
    secondaryCta: 'Learn More',
  },
  services: {
    frontend: {
      title: 'Frontend Development',
      description: 'Modern React and Next.js applications',
      features: [
        'Responsive Design',
        'Performance Optimization',
        'SEO Friendly',
      ],
    },
    backend: {
      title: 'Backend Development',
      description: 'Scalable API development',
      features: ['REST APIs', 'Database Design', 'Security'],
    },
    ai: {
      title: 'AI Integration',
      description: 'Machine learning and AI solutions',
      features: ['Chatbots', 'Data Analysis', 'Automation'],
    },
  },
  footer: {
    copyright: '© 2024 All rights reserved',
    links: ['Privacy Policy', 'Terms of Service', 'Contact Us'],
    social: {
      twitter: 'Follow us on Twitter',
      linkedin: 'Connect on LinkedIn',
      github: 'View our code',
    },
  },
  structuredData: {
    metrics: [
      {
        label: 'Projects Completed',
        value: '100+',
        description: 'Successful projects delivered',
      },
      {
        label: 'Happy Clients',
        value: '50+',
        description: 'Satisfied customers worldwide',
      },
      {
        label: 'Years Experience',
        value: '5+',
        description: 'Professional experience',
      },
    ],
    testimonials: [
      {
        name: 'John Doe',
        role: 'CEO',
        company: 'Tech Corp',
        text: 'Amazing work and great communication',
      },
      {
        name: 'Jane Smith',
        role: 'CTO',
        company: 'Startup Inc',
        text: 'Exceeded our expectations',
      },
    ],
  },
  forms: {
    contact: {
      title: 'Get in Touch',
      fields: {
        name: 'Full Name',
        email: 'Email Address',
        message: 'Your Message',
        submit: 'Send Message',
      },
      validation: {
        required: 'This field is required',
        email: 'Please enter a valid email',
        minLength: 'Minimum 10 characters',
      },
    },
    quote: {
      title: 'Request a Quote',
      fields: {
        project: 'Project Type',
        budget: 'Budget Range',
        timeline: 'Timeline',
        submit: 'Get Quote',
      },
    },
  },
};

const mockPartialTranslations = {
  navigation: {
    home: 'Inicio',
    services: 'Servicios',
    contact: 'Contacto',
    // Missing: about, blog, portfolio
  },
  hero: {
    title: 'Desarrollo Web Profesional',
    subtitle: 'Creamos sitios web increíbles',
    // Missing: cta, secondaryCta
  },
  services: {
    frontend: {
      title: 'Desarrollo Frontend',
      description: 'Aplicaciones modernas de React y Next.js',
      // Missing: features array
    },
    // Missing: backend, ai
  },
  // Missing: footer, structuredData, forms
};

describe('Extended Translation Insertion Tests', () => {
  describe('Complex Nested Structures', () => {
    test('should handle deeply nested objects with arrays', () => {
      const complexTemplate = {
        page: {
          sections: [
            {
              type: 'hero',
              content: {
                title: 'Welcome',
                subtitle: 'Get started today',
                buttons: ['Learn More', 'Sign Up', 'Contact Us'],
              },
            },
            {
              type: 'features',
              items: [
                {
                  title: 'Feature 1',
                  description: 'Description 1',
                  tags: ['tag1', 'tag2'],
                },
                {
                  title: 'Feature 2',
                  description: 'Description 2',
                  tags: ['tag3'],
                },
              ],
            },
          ],
          metadata: {
            title: 'Page Title',
            description: 'Page Description',
            keywords: ['web', 'development', 'services'],
          },
        },
      };

      const keys = getAllKeys(complexTemplate);

      // Verify all expected keys are present
      expect(keys).toContain('page.sections.0.type');
      expect(keys).toContain('page.sections.0.content.title');
      expect(keys).toContain('page.sections.0.content.subtitle');
      expect(keys).toContain('page.sections.0.content.buttons.0');
      expect(keys).toContain('page.sections.0.content.buttons.1');
      expect(keys).toContain('page.sections.0.content.buttons.2');
      expect(keys).toContain('page.sections.1.type');
      expect(keys).toContain('page.sections.1.items.0.title');
      expect(keys).toContain('page.sections.1.items.0.description');
      expect(keys).toContain('page.sections.1.items.0.tags.0');
      expect(keys).toContain('page.sections.1.items.0.tags.1');
      expect(keys).toContain('page.sections.1.items.1.title');
      expect(keys).toContain('page.sections.1.items.1.description');
      expect(keys).toContain('page.sections.1.items.1.tags.0');
      expect(keys).toContain('page.metadata.title');
      expect(keys).toContain('page.metadata.description');
      expect(keys).toContain('page.metadata.keywords.0');
      expect(keys).toContain('page.metadata.keywords.1');
      expect(keys).toContain('page.metadata.keywords.2');

      expect(keys).toHaveLength(19);
    });

    test('should insert translations into complex nested structure', () => {
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
      setNestedValue(targetLang, 'page.sections.0.type', 'hero');
      setNestedValue(targetLang, 'page.sections.0.content.title', 'Bienvenido');
      setNestedValue(
        targetLang,
        'page.sections.0.content.subtitle',
        'Comienza hoy'
      );
      setNestedValue(
        targetLang,
        'page.sections.0.content.buttons.0',
        'Aprende Más'
      );
      setNestedValue(
        targetLang,
        'page.sections.0.content.buttons.1',
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

  describe('Array Handling', () => {
    test('should handle empty arrays correctly', () => {
      const templateWithEmptyArray = {
        items: [],
        title: 'Test',
      };

      const keys = getAllKeys(templateWithEmptyArray);
      expect(keys).toEqual(['title']);
    });

    test('should handle arrays with mixed content types', () => {
      const mixedArrayTemplate = {
        content: [
          'Simple string',
          { title: 'Object with title', description: 'Description' },
          ['Nested array item 1', 'Nested array item 2'],
          42,
          null,
        ],
      };

      const keys = getAllKeys(mixedArrayTemplate);

      expect(keys).toContain('content.0');
      expect(keys).toContain('content.1.title');
      expect(keys).toContain('content.1.description');
      expect(keys).toContain('content.2.0');
      expect(keys).toContain('content.2.1');
      expect(keys).toContain('content.3');
      expect(keys).toContain('content.4');
    });

    test('should handle sparse arrays correctly', () => {
      const sparseArray = [];
      sparseArray[0] = 'First item';
      sparseArray[5] = 'Sixth item';

      const template = { items: sparseArray };
      const keys = getAllKeys(template);

      expect(keys).toContain('items.0');
      expect(keys).toContain('items.5');
      expect(keys).toHaveLength(6);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined values', () => {
      const templateWithNulls = {
        title: 'Test',
        description: null,
        content: undefined,
        items: [null, undefined, 'valid'],
      };

      const keys = getAllKeys(templateWithNulls);

      expect(keys).toContain('title');
      expect(keys).toContain('description');
      expect(keys).toContain('content');
      expect(keys).toContain('items.0');
      expect(keys).toContain('items.1');
      expect(keys).toContain('items.2');
    });

    test('should handle circular references gracefully', () => {
      const circularObj = { name: 'test' };
      circularObj.self = circularObj;

      // This should not cause infinite recursion
      expect(() => getAllKeys(circularObj)).toThrow();
    });

    test('should handle very deep nesting', () => {
      let deepObj = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        deepObj = { nested: deepObj };
      }

      const keys = getAllKeys(deepObj);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('Real Translation Scenarios', () => {
    test('should handle complete translation insertion for Spanish', () => {
      const targetLang = { ...mockPartialTranslations };
      const missingKeys = getMissingKeys(mockEnglishTemplate, targetLang);

      // Simulate translated values for all missing keys
      const translatedValues = {
        // Navigation
        'navigation.about': 'Acerca de',
        'navigation.blog': 'Blog',
        'navigation.portfolio': 'Portafolio',

        // Hero
        'hero.cta': 'Comenzar',
        'hero.secondaryCta': 'Aprende Más',

        // Services
        'services.frontend.features.0': 'Diseño Responsivo',
        'services.frontend.features.1': 'Optimización de Rendimiento',
        'services.frontend.features.2': 'SEO Amigable',
        'services.backend.title': 'Desarrollo Backend',
        'services.backend.description': 'Desarrollo de API escalable',
        'services.backend.features.0': 'APIs REST',
        'services.backend.features.1': 'Diseño de Base de Datos',
        'services.backend.features.2': 'Seguridad',
        'services.ai.title': 'Integración de IA',
        'services.ai.description': 'Soluciones de machine learning e IA',
        'services.ai.features.0': 'Chatbots',
        'services.ai.features.1': 'Análisis de Datos',
        'services.ai.features.2': 'Automatización',

        // Footer
        'footer.copyright': '© 2024 Todos los derechos reservados',
        'footer.links.0': 'Política de Privacidad',
        'footer.links.1': 'Términos de Servicio',
        'footer.links.2': 'Contáctanos',
        'footer.social.twitter': 'Síguenos en Twitter',
        'footer.social.linkedin': 'Conéctate en LinkedIn',
        'footer.social.github': 'Ve nuestro código',

        // Structured Data
        'structuredData.metrics.0.label': 'Proyectos Completados',
        'structuredData.metrics.0.value': '100+',
        'structuredData.metrics.0.description': 'Proyectos exitosos entregados',
        'structuredData.metrics.1.label': 'Clientes Satisfechos',
        'structuredData.metrics.1.value': '50+',
        'structuredData.metrics.1.description':
          'Clientes satisfechos en todo el mundo',
        'structuredData.metrics.2.label': 'Años de Experiencia',
        'structuredData.metrics.2.value': '5+',
        'structuredData.metrics.2.description': 'Experiencia profesional',
        'structuredData.testimonials.0.name': 'Juan Pérez',
        'structuredData.testimonials.0.role': 'CEO',
        'structuredData.testimonials.0.company': 'Tech Corp',
        'structuredData.testimonials.0.text':
          'Trabajo increíble y gran comunicación',
        'structuredData.testimonials.1.name': 'María García',
        'structuredData.testimonials.1.role': 'CTO',
        'structuredData.testimonials.1.company': 'Startup Inc',
        'structuredData.testimonials.1.text': 'Superó nuestras expectativas',

        // Forms
        'forms.contact.title': 'Ponte en Contacto',
        'forms.contact.fields.name': 'Nombre Completo',
        'forms.contact.fields.email': 'Dirección de Email',
        'forms.contact.fields.message': 'Tu Mensaje',
        'forms.contact.fields.submit': 'Enviar Mensaje',
        'forms.contact.validation.required': 'Este campo es requerido',
        'forms.contact.validation.email': 'Por favor ingresa un email válido',
        'forms.contact.validation.minLength': 'Mínimo 10 caracteres',
        'forms.quote.title': 'Solicitar Cotización',
        'forms.quote.fields.project': 'Tipo de Proyecto',
        'forms.quote.fields.budget': 'Rango de Presupuesto',
        'forms.quote.fields.timeline': 'Cronograma',
        'forms.quote.fields.submit': 'Obtener Cotización',
      };

      // Insert each missing translation
      missingKeys.forEach((key) => {
        const translatedValue = translatedValues[key];
        if (translatedValue !== undefined) {
          setNestedValue(targetLang, key, translatedValue);
        }
      });

      // Verify all keys now exist
      missingKeys.forEach((key) => {
        if (translatedValues[key] !== undefined) {
          expect(keyExists(targetLang, key)).toBe(true);
        }
      });

      // Verify specific complex translations
      expect(targetLang.services.frontend.features[0]).toBe(
        'Diseño Responsivo'
      );
      expect(targetLang.structuredData.metrics[0].label).toBe(
        'Proyectos Completados'
      );
      expect(targetLang.structuredData.testimonials[0].name).toBe('Juan Pérez');
      expect(targetLang.forms.contact.validation.required).toBe(
        'Este campo es requerido'
      );

      // Verify no missing keys remain (except those without translations)
      const remainingMissing = getMissingKeys(mockEnglishTemplate, targetLang);
      const missingWithoutTranslation = remainingMissing.filter(
        (key) => !translatedValues[key]
      );
      expect(missingWithoutTranslation).toHaveLength(0);
    });

    test('should preserve existing translations when inserting new ones', () => {
      const targetLang = { ...mockPartialTranslations };

      // Verify existing translations are preserved
      expect(targetLang.navigation.home).toBe('Inicio');
      expect(targetLang.hero.title).toBe('Desarrollo Web Profesional');
      expect(targetLang.services.frontend.title).toBe('Desarrollo Frontend');

      // Insert new translations
      setNestedValue(targetLang, 'navigation.about', 'Acerca de');
      setNestedValue(targetLang, 'hero.cta', 'Comenzar');
      setNestedValue(
        targetLang,
        'services.backend.title',
        'Desarrollo Backend'
      );

      // Verify existing translations are still there
      expect(targetLang.navigation.home).toBe('Inicio');
      expect(targetLang.hero.title).toBe('Desarrollo Web Profesional');
      expect(targetLang.services.frontend.title).toBe('Desarrollo Frontend');

      // Verify new translations were added
      expect(targetLang.navigation.about).toBe('Acerca de');
      expect(targetLang.hero.cta).toBe('Comenzar');
      expect(targetLang.services.backend.title).toBe('Desarrollo Backend');
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of keys efficiently', () => {
      const largeTemplate = {};

      // Create a large template with 1000 keys
      for (let i = 0; i < 100; i++) {
        largeTemplate[`section${i}`] = {
          title: `Title ${i}`,
          description: `Description ${i}`,
          items: Array.from({ length: 10 }, (_, j) => ({
            name: `Item ${i}-${j}`,
            value: `Value ${i}-${j}`,
          })),
        };
      }

      const startTime = Date.now();
      const keys = getAllKeys(largeTemplate);
      const endTime = Date.now();

      expect(keys).toHaveLength(2200); // 100 sections * (2 + 10*2) keys each
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
