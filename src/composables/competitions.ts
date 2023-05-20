import { useFirestore } from '@vueuse/firebase';
import { collection, query, where } from 'firebase/firestore';
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
  year: Ref<string>;
  error: Ref<Error>;
} => {
  const year = ref<string>(new Date().getFullYear().toString());
  const error = ref<Error>();

  const competitionsQuery = computed(() =>
    query(
      collection(firestore, 'competitions'),
      where('year', '==', year.value)
    ).withConverter(converter)
  );
  const competitions = useFirestore(competitionsQuery, undefined, {
    errorHandler: (e: Error) => (error.value = e),
  });

  return { competitions, year, error };
};
