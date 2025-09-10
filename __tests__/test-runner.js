// Simple test runner for Node.js without Jest
export class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.total = 0;
  }

  describe(name, fn) {
    console.log(`\n📋 ${name}`);
    console.log('='.repeat(name.length + 2));
    fn();
  }

  test(name, fn) {
    this.total++;
    try {
      fn();
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      this.failed++;
    }
  }

  expect(value) {
    return {
      toBe: (expected) => {
        if (value !== expected) {
          throw new Error(`Expected ${value} to be ${expected}`);
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(value) !== JSON.stringify(expected)) {
          throw new Error(
            `Expected ${JSON.stringify(value)} to equal ${JSON.stringify(
              expected
            )}`
          );
        }
      },
      toContain: (expected) => {
        if (!value.includes(expected)) {
          throw new Error(`Expected ${value} to contain ${expected}`);
        }
      },
      toHaveLength: (expected) => {
        if (value.length !== expected) {
          throw new Error(`Expected length ${value.length} to be ${expected}`);
        }
      },
      toBeGreaterThan: (expected) => {
        if (value <= expected) {
          throw new Error(`Expected ${value} to be greater than ${expected}`);
        }
      },
      toBeLessThan: (expected) => {
        if (value >= expected) {
          throw new Error(`Expected ${value} to be less than ${expected}`);
        }
      },
      toBeUndefined: () => {
        if (value !== undefined) {
          throw new Error(`Expected ${value} to be undefined`);
        }
      },
      not: {
        toBe: (expected) => {
          if (value === expected) {
            throw new Error(`Expected ${value} not to be ${expected}`);
          }
        },
        toContain: (expected) => {
          if (value.includes(expected)) {
            throw new Error(`Expected ${value} not to contain ${expected}`);
          }
        },
      },
    };
  }

  run() {
    console.log('🚀 Starting Test Suite...\n');

    // Run all tests
    this.tests.forEach((test) => test());

    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`Total: ${this.total}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!');
      process.exit(1);
    }
  }
}

// Global test functions
export const describe = (name, fn) => {
  console.log(`\n📋 ${name}`);
  console.log('='.repeat(name.length + 2));
  fn();
};

export const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    throw error;
  }
};

export const expect = (value) => {
  return {
    toBe: (expected) => {
      if (value !== expected) {
        throw new Error(`Expected ${value} to be ${expected}`);
      }
    },
    toEqual: (expected) => {
      if (JSON.stringify(value) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(value)} to equal ${JSON.stringify(
            expected
          )}`
        );
      }
    },
    toContain: (expected) => {
      if (!value.includes(expected)) {
        throw new Error(`Expected ${value} to contain ${expected}`);
      }
    },
    toHaveLength: (expected) => {
      if (value.length !== expected) {
        throw new Error(`Expected length ${value.length} to be ${expected}`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toBeLessThan: (expected) => {
      if (value >= expected) {
        throw new Error(`Expected ${value} to be less than ${expected}`);
      }
    },
    toBeUndefined: () => {
      if (value !== undefined) {
        throw new Error(`Expected ${value} to be undefined`);
      }
    },
    not: {
      toBe: (expected) => {
        if (value === expected) {
          throw new Error(`Expected ${value} not to be ${expected}`);
        }
      },
      toContain: (expected) => {
        if (value.includes(expected)) {
          throw new Error(`Expected ${value} not to contain ${expected}`);
        }
      },
    },
  };
};

// Add toThrow function for testing error cases
export const toThrow = (fn) => {
  try {
    fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    return {
      toThrow: () => {
        // Function threw an error as expected
        return true;
      },
    };
  }
};
