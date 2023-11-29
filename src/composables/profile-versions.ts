import { useLoading } from './loading';
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
  to: (
    profile: WithFieldValue<T> | FieldValue | PartialWithFieldValue<T>
  ) => DocumentData;
  from: (data: DocumentData) => T;
};

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

export const useProfileVersions = <T>(
  firestore: Firestore,
  collectionName: string,
  robotRef: Ref<Robot.BluetoothConnectionConfig>,
  competitionIdRef: Ref<Dashboard.Competition['id']>,
  profileConverter?: ProfileConverter<T>,
  errorHandler?: (e: Error) => void
) => {
  const { loading, notifyLoading } = useLoading();

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

  const persistVersion = notifyLoading(async function (
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
  });

  const deleteVersion = notifyLoading(async function (
    id: string
  ): Promise<void> {
    await deleteDoc(doc(firestore, collectionName, id));
  });

  return { versions, loading, persistVersion, deleteVersion };
};
