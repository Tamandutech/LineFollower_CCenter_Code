import { type Ref, ref } from 'vue';
import { useConfirmDialog } from '@vueuse/core';

export type ActionSettings = {
  /**
   * Título da caixa de diálogo.
   */
  title: string;

  /**
   * Pergunta a ser exibida na caixa de diálogo.
   */
  question: string;

  /**
   * Função para tratar erros lançados na execução da ação. Se não for fornecida, o erro será lançado novamente.
   */
  errorHandler?: (error: unknown) => void;
};

export type SuccessFeedback = {
  /**
   * Título da caixa de diálogo.
   */
  summary: string;

  /**
   * Mensagem a ser exibida na caixa de diálogo.
   */
  message: string;
};

export type UsePerformActionDialogReturn = {
  /**
   * Estado que diz se a caixa de diálogo está visível.
   */
  isRevealed: Ref<boolean>;

  /**
   * Estado da caixa de diálogo.
   */
  readonly state: Ref<ActionSettings | undefined>;

  /**
   * Executa uma ação e exibe uma caixa de diálogo para confirmação.
   *
   * @param action Ação a ser executada
   * @param parameters Parâmetros da ação
   * @param settings Configurações da caixa de diálogo
   * @returns {Promise<void>}
   */
  performAction: <ParametersType extends unknown[], ReturnType>(
    action: (...parameters: ParametersType) => Promise<ReturnType>,
    parameters: ParametersType,
    settings: ActionSettings
  ) => Promise<void>;

  /**
   * Confirma a execução da ação.
   *
   * @returns {void}
   */
  confirm: () => void;

  /**
   * Cancela a execução da ação.
   *
   * @returns {void}
   */
  cancel: () => void;
};

export type UseSuccessFeedbackReturn = {
  /**
   * Estado da caixa de diálogo.
   */
  readonly feedback: Ref<SuccessFeedback | undefined>;

  /**
   * Retorna uma função que executa a ação e exibe uma caixa de diálogo informando o sucesso
   * da ação, caso não tenha ocorrido um erro.
   *
   * @param action Ação a ser executada
   * @param successFeedback Configurações da caixa de diálogo de sucesso
   * @param onError Função para tratar erros lançados na execução da ação. Se não for fornecida, o erro será lançado novamente.
   * @returns {Function}
   */
  withSuccessFeedback: <ParametersType extends unknown[], ReturnType>(
    action: (...parameters: ParametersType) => Promise<ReturnType>,
    successFeedback: SuccessFeedback,
    onError?: (error: unknown) => void
  ) => (...parameters: ParametersType) => Promise<ReturnType>;
};

/**
 * Hook para executar uma ação e exibir uma caixa de diálogo para confirmação.
 *
 * @returns {UsePerformActionDialogReturn}
 */
export const usePerformActionDialog = (): UsePerformActionDialogReturn => {
  const { isRevealed, confirm, cancel, reveal } = useConfirmDialog();
  const state = ref<Pick<ActionSettings, 'title' | 'question'>>();

  const performAction = async function <
    ParametersType extends unknown[],
    ReturnType
  >(
    action: (...parameters: ParametersType) => Promise<ReturnType>,
    parameters: ParametersType,
    settings: ActionSettings
  ) {
    state.value = { title: settings.title, question: settings.question };

    const { isCanceled } = await reveal();
    if (!isCanceled) {
      try {
        await action(...parameters);
      } catch (error) {
        if (settings.errorHandler) {
          settings.errorHandler(error);
        } else {
          throw error;
        }
      }
    }
  };

  return { isRevealed, state, performAction, confirm, cancel };
};

/**
 * Hook para executar uma ação e exibir uma caixa de diálogo informando o sucesso.
 *
 * @param {Function} errorHandler Função para tratar erros lançados na execução da ação.
 * Se não for fornecida, o erro será lançado novamente.
 * @returns {UseSuccessFeedbackReturn}
 */
export const useSuccessFeedback = (
  errorHandler?: (error: unknown) => void
): UseSuccessFeedbackReturn => {
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
