import { describe, it, expect } from 'vitest';

/**
 * Example unit test to verify test setup works correctly
 */
describe('Example Unit Tests', () => {
  it('should perform basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should work with strings', () => {
    const message = 'hello';
    expect(message.toUpperCase()).toBe('HELLO');
  });

  it('should handle arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
  });

  it('should handle objects', () => {
    const user = { name: 'John', age: 30 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('John');
  });
});
