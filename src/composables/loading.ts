import { ref } from 'vue';

export const useLoading = () => {
  const loading = ref(false);

  function notifyLoading<This, Args extends unknown[], Return>(
    routine: (this: This, ...args: Args) => Promise<Return>
  ) {
    async function notifiedRoutine(this: This, ...args: Args): Promise<Return> {
      loading.value = true;
      try {
        const result = await routine.call(this, ...args);
        return Promise.resolve(result);
      } catch (error) {
        throw error;
      } finally {
        loading.value = false;
      }
    }

    return notifiedRoutine;
  }

  return { loading, notifyLoading };
};
