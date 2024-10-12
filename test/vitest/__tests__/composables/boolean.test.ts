import { it, expect, describe } from 'vitest';
import { ref } from 'vue';
import { useIsTruthy } from 'src/composables/boolean';

describe('useIsTruthy', () => {
  it('should return true if the reference is truthy', () => {
    const reference = ref('test');
    const isTruthy = useIsTruthy(reference);

    expect(isTruthy.value).toBe(true);
  });

  it('should return false if the reference is falsy', () => {
    const reference = ref('');
    const isTruthy = useIsTruthy(reference);

    expect(isTruthy.value).toBe(false);
  });
});
