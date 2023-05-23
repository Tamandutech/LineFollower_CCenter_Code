import { ref } from 'vue';
import { useConfirmDialog } from '@vueuse/core';

export type UsePerformActionDialogOptions = {
  title?: string;
  question?: string;
  errorHandler?: (error: unknown) => void;
};

export type SuccessFeedback = { summary: string; message: string };

export const usePerformActionDialog = (
  { title, question, errorHandler }: UsePerformActionDialogOptions = {
    title: 'Confirmar',
    question: 'Tem certeza',
  }
) => {
  const { isRevealed, confirm, cancel, reveal } = useConfirmDialog();
  const state =
    ref<Pick<UsePerformActionDialogOptions, 'title' | 'question'>>();

  const performAction = async function <
    ParametersType extends unknown[],
    ReturnType
  >(
    action: (...parameters: ParametersType) => Promise<ReturnType>,
    parameters: ParametersType,
    options: UsePerformActionDialogOptions = {}
  ) {
    options.errorHandler = options.errorHandler || errorHandler;
    title = options.title || title;
    question = options.question || question;

    state.value = { title, question };
    const { isCanceled } = await reveal();
    if (!isCanceled) {
      try {
        await action(...parameters);
      } catch (error) {
        if (options.errorHandler) {
          options.errorHandler(error);
        } else {
          throw error;
        }
      }
    }
  };

  return { isRevealed, state, performAction, confirm, cancel };
};

export const useSuccessFeedback = (errorHandler?: (error: unknown) => void) => {
  const feedback = ref<SuccessFeedback>();

  function withSuccessFeedback<ParametersType extends unknown[], ReturnType>(
    action: (...parameters: ParametersType) => Promise<ReturnType>,
    successFeedback: SuccessFeedback,
    onError?: (error: unknown) => void
  ): (...parameters: ParametersType) => Promise<ReturnType> {
    onError = onError || errorHandler;

    return async function (...parameters: ParametersType): Promise<ReturnType> {
      try {
        const result = await action(...parameters);
        feedback.value = successFeedback;
        return result;
      } catch (error) {
        if (onError) {
          onError(error);
        } else {
          throw error;
        }
      }
    };
  }

  return { feedback, withSuccessFeedback };
};
