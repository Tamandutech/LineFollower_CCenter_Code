import { beforeEach, it, expect, describe, vi, type Mock } from 'vitest';
import { useLoading } from 'src/composables/loading';

describe('useLoading', () => {
  let routineMock: Mock;

  beforeEach(() => {
    routineMock = vi.fn();
  });

  it('should return a function that notifies the loading state', async () => {
    const [notifiedRoutine, loading] = useLoading(routineMock);
    routineMock.mockResolvedValueOnce(1);

    await notifiedRoutine();

    expect(loading.value).toBe(false);
  });
});
