import { getDoc, doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { markRaw } from 'vue';
import type { Firestore } from 'firebase/firestore';
import type { PiniaPlugin, PiniaPluginContext } from 'pinia';

/**
 * Retorna um plugin para o Pinia que adiciona uma referência para
 * o serviço nas stores e possibilita a sincronização automática do estado com um documento salvo no Firestore.
 *
 * A sincronização é habilitada caso a opção `sync` tenha sido definida para a store.
 * O documento é identificado pelos atributos `collection` e `doc`
 * (que pode ser um campo do estado ou o ID de um documento),
 * e os campos a serem atualizalizados devem ser especificados pelo atributo `fields`.
 *
 * @param firestore Serviço associado a um app do Firebase
 * @returns `PiniaPlugin`
 */
export const syncStoresPlugin = function (firestore: Firestore): PiniaPlugin {
  return ({ store, options }: PiniaPluginContext) => {
    store.firestore = markRaw(firestore);
    if (!options.sync) return;

    /**
     * TODO: salvar localmente caso usuário esteja offline
     */
    store.$subscribe(
      async (mutation, state) => {
        const fieldsChanged: string[] = Object.keys(
          mutation.type === 'patch object' ? mutation.payload : state
        );

        const payload = [...options.sync.fields.entries()].reduce(
          (
            obj: Record<string, unknown>,
            [stateField, { field: modelField, ref }]
          ) => {
            if (
              fieldsChanged.includes(stateField.toString()) &&
              state[stateField]
            ) {
              obj[modelField] = ref
                ? doc(firestore, ref, state[stateField])
                : state[stateField];
            }
            return obj;
          },
          {}
        );

        const docSnapshot = await getDoc(
          doc(
            firestore,
            options.sync.collection,
            state[options.sync.doc] || options.sync.doc
          )
        );
        if (docSnapshot.exists()) {
          await setDoc(docSnapshot.ref, payload);
        } else if (options.sync.create) {
          await addDoc(collection(firestore, options.sync.collection), payload);
        }
      },
      { detached: true, deep: true }
    );
  };
};
