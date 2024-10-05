import { beforeEach, it, expect, describe, vi, type Mock } from 'vitest';
import { ref } from 'vue';
import { usePerformActionDialog } from 'src/composables/actions';

let actionMock: Mock;

beforeEach(() => {
  actionMock = vi.fn();
  vi.mock('@vueuse/core', () => ({
    useConfirmDialog: () => ({
      isRevealed: ref(false),
      confirm: vi.fn(),
      cancel: vi.fn(),
      reveal: vi.fn(async () => ({ isCanceled: false })),
    }),
  }));
});

describe('usePerformActionDialog', () => {
  it('should execute the action and show a confirmation dialog', async () => {
    const { performAction } = usePerformActionDialog();

    await performAction(actionMock, [1], {
      title: 'Title',
      question: 'Question',
    });

    expect(actionMock).toBeCalledWith(1);
  });

  it('should call errorHandler if an error is thrown', async () => {
    const errorHandler = vi.fn();
    const { performAction } = usePerformActionDialog();

    actionMock.mockRejectedValueOnce(new Error('Error'));

    await performAction(actionMock, [1], {
      title: 'Title',
      question: 'Question',
      errorHandler,
    });

    expect(errorHandler).toBeCalledWith(new Error('Error'));
  });
});
