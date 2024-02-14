import { useFirestore } from '@vueuse/firebase';
import { collection, query } from 'firebase/firestore';
import { ref, computed } from 'vue';
import type { Firestore, FirestoreDataConverter } from 'firebase/firestore';
import type { Ref } from 'vue';

export type UseCompetitionsReturn = {
  /**
   * Lista de competições registradas.
   */
  competitions: Ref<Dashboard.Competition[]>;

  /**
   * Erro ocorrido durante a busca dos registros no banco de dados.
   */
  error: Ref<Error>;
};

/**
 * Conversor dos dados da competição para o formato de objeto esperado pelo Firestore.
 */
const converter: FirestoreDataConverter<Dashboard.Competition> = {
  toFirestore(modelObject) {
    return { ...modelObject };
  },
  fromFirestore(snapshot) {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      year: data.year,
    };
  },
};

/**
 * Hook para manipulação das competições.
 *
 * @param {Firestore} firestore Instância do Firestore
 * @returns
 */
export const useCompetitions = (
  firestore: Firestore
): UseCompetitionsReturn => {
  const error = ref<Error>();

  const competitionsQuery = computed(() =>
    query(collection(firestore, 'competitions')).withConverter(converter)
  );
  const competitions = useFirestore(competitionsQuery, undefined, {
    errorHandler: (e: Error) => (error.value = e),
  });

  return { competitions, error };
};
