import { useFirestore } from '@vueuse/firebase';
import { collection, query } from 'firebase/firestore';
import { ref, computed } from 'vue';
import type { Firestore, FirestoreDataConverter } from 'firebase/firestore';
import type { Ref } from 'vue';

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

export const useCompetitions = (
  firestore: Firestore
): {
  competitions: Ref<Dashboard.Competition[]>;
  error: Ref<Error>;
} => {
  const error = ref<Error>();

  const competitionsQuery = computed(() =>
    query(collection(firestore, 'competitions')).withConverter(converter)
  );
  const competitions = useFirestore(competitionsQuery, undefined, {
    errorHandler: (e: Error) => (error.value = e),
  });

  return { competitions, error };
};
