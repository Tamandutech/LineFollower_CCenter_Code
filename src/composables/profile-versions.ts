import { v4 as uuidv4 } from 'uuid';
import { computed } from 'vue';
import {
  query,
  collection,
  where,
  doc,
  setDoc,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import type {
  Firestore,
  FirestoreDataConverter,
  DocumentReference,
  DocumentData,
  WithFieldValue,
  FieldValue,
  PartialWithFieldValue,
} from 'firebase/firestore';
import type { Ref } from 'vue';
import { useFirestore } from '@vueuse/firebase';

export type ProfileConverter<T> = {
  /**
   * Converte uma versão da configuração em um objeto a ser persistido no banco de dados.
   *
   * @param profile Versão da configuração a ser convertida
   * @returns {DocumentData} Objeto a ser persistido no banco de dados
   */
  to: (
    profile: WithFieldValue<T> | FieldValue | PartialWithFieldValue<T>
  ) => DocumentData;

  /**
   * Converte um objeto persistido no banco de dados em uma versão da configuração.
   *
   * @param data Objeto persistido no banco de dados
   * @returns {T} Versão da configuração
   */
  from: (data: DocumentData) => T;
};

export type UseProfileVersionsReturn<T> = {
  /**
   * Versões de alguma configuração do robô (como parâmetros ou mapeamento).
   */
  versions: ReturnType<typeof useFirestore>;

  /**
   * Persiste uma versão da configuração do robô.
   *
   * @param data Versão da configuração a ser persistida
   * @param id Id da versão da configuração a ser persistida
   * @param description Descrição da versão da configuração a ser persistida
   * @returns {Promise<void>} `Promise` vazia que resolve quando a versão da configuração é persistida
   */
  persistVersion: (
    data: WithFieldValue<T> | FieldValue,
    id?: string,
    description?: string
  ) => Promise<void>;

  /**
   * Deleta uma versão da configuração do robô.
   *
   * @param id Id da versão da configuração a ser deletada
   * @returns {Promise<void>} `Promise` vazia que resolve quando a versão da configuração é deletada
   */
  deleteVersion: (id: string) => Promise<void>;
};

/**
 * Retorna o objeto que converte as versões da configuração para o formato esperado pelo banco de dados.
 *
 * @param {DocumentReference} robotDocRef Referência do documento com as informações do robô
 * @param {DocumentReference} competitionDocRef Referência do documento com as informações da competição
 * @param {ProfileConverter<T>} [profileConverter] Conversor para a versão da configuração
 * @returns {FirestoreDataConverter<Robot.ProfileVersion<T>>}
 */
const getFirestoreConverter = <T>(
  robotDocRef: DocumentReference,
  competitionDocRef: DocumentReference,
  profileConverter?: ProfileConverter<T>
): FirestoreDataConverter<Robot.ProfileVersion<T>> => ({
  toFirestore(modelObject) {
    return {
      created: modelObject.created,
      updated: modelObject.updated,
      description: modelObject.description,
      robot: robotDocRef,
      competition: competitionDocRef,
      data: profileConverter
        ? profileConverter.to(modelObject.data)
        : modelObject.data,
    };
  },
  fromFirestore(snapshot) {
    const profile = snapshot.data();
    return {
      id: snapshot.id,
      description: profile.description,
      created: profile.created,
      updated: profile.updated,
      data: profileConverter
        ? profileConverter.from(profile.data)
        : profile.data,
    };
  },
});

/**
 * Hook para gerenciar as versões de alguma configuração do robô (como parâmetros ou mapeamento).
 *
 * @param {Firestore} firestore Instância do Firestore
 * @param {string} collectionName Nome da coleção onde as versões da configuração serão persistidas
 * @param {Ref<Robot.BluetoothConnectionConfig>} robotRef Referência para as informações do robô
 * @param {Ref<Dashboard.Competition['id']>} competitionIdRef Referência para o Id da competição da sessão atual
 * @param {ProfileConverter<T>} [profileConverter] Conversor para a versão da configuração
 * @param {Function} [errorHandler] Função para tratar erros durante as operações no banco de dados
 * @returns {UseProfileVersionsReturn<T>}
 */
export const useProfileVersions = <T>(
  firestore: Firestore,
  collectionName: string,
  robotRef: Ref<Robot.BluetoothConnectionConfig>,
  competitionIdRef: Ref<Dashboard.Competition['id']>,
  profileConverter?: ProfileConverter<T>,
  errorHandler?: (e: Error) => void
): UseProfileVersionsReturn<T> => {
  const robotDocRef = computed(() =>
    doc(firestore, 'robots', robotRef.value.id)
  );
  const competitionDocRef = computed(() =>
    doc(firestore, 'competitions', competitionIdRef.value)
  );
  const converter = getFirestoreConverter(
    robotDocRef.value,
    competitionDocRef.value,
    profileConverter
  );

  const versionsQuery = computed(() =>
    query(
      collection(firestore, collectionName),
      where('competition', '==', competitionDocRef.value),
      where('robot', '==', robotDocRef.value)
    ).withConverter(converter)
  );
  const versions = useFirestore(versionsQuery.value, [], {
    errorHandler:
      errorHandler ||
      ((error: unknown) => {
        throw error;
      }),
    autoDispose: false,
  });

  async function persistVersion(
    data: WithFieldValue<T> | FieldValue,
    id?: string,
    description?: string
  ): Promise<void> {
    if (Array.isArray(data) && data.length === 0) {
      return; // Não registrar listas ou objetos vazios
    }

    const timestamp = Timestamp.fromDate(new Date());
    id = id || uuidv4();
    description = description || '';
    await setDoc(
      doc(firestore, collectionName, id),
      converter.toFirestore({
        data,
        id,
        description,
        created: timestamp,
        updated: timestamp,
      })
    );
  }

  async function deleteVersion(id: string): Promise<void> {
    await deleteDoc(doc(firestore, collectionName, id));
  }

  return { versions, persistVersion, deleteVersion };
};
