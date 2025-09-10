import { getAllKeys } from '../translation-utils.js';
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
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
