import { beforeEach, it, expect, describe, vi, type Mock } from 'vitest';
import { useErrorCapturing } from 'src/composables/error';

describe('useErrorCapturing', () => {
  let routineMock: Mock;

  beforeEach(() => {
    routineMock = vi.fn();
  });

  it('should return the routine with error capturing', async () => {
    const [routine, error] = useErrorCapturing(routineMock, [Error]);
    await routine();
    expect(error.value).toBe(null);
  });

  it('should rethrow the error if mustReThrow is true', async () => {
    const errorMock = new Error();
    routineMock.mockRejectedValueOnce(errorMock);
    const [routine, error] = useErrorCapturing(
      routineMock,
      [Error],
      undefined,
      true,
    );
    await expect(routine()).rejects.toBe(errorMock);
    expect(error.value).toBe(errorMock);
  });
});
