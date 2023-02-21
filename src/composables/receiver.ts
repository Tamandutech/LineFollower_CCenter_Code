import { ref } from 'vue';
import type { Ref } from 'vue';

export const useMessageReceiver = <T>(
  successCallback?: () => void
): {
  result: Ref<T>;
  error: Ref<unknown>;
  receiver: Queue.MessageReceiver<T>;
} => {
  const result = ref<T>();
  const error = ref<unknown>();
  const receiver: Queue.MessageReceiver<T> = ({ error: e, result: r }) => {
    if (e) {
      error.value = e;
      return;
    }

    result.value = r;

    return successCallback && successCallback();
  };

  return { result, error, receiver };
};
