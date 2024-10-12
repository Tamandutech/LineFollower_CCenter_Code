<template>
  <q-dialog
    v-model="show"
    :maximized="$q.platform.is.mobile"
    full-width
    full-height
  >
    <q-card class="bg-grey-3">
      <q-card-section class="bg-grey-9 text-white">
        <div class="text-h5">{{ title }}</div>
        <div class="text-subtitle2">Versões salvas</div>
      </q-card-section>
      <q-card-section class="q-pb-none">
        <div class="row">
          <q-input
            class="col"
            color="teal-5"
            rounded
            bg-color="white"
            filled
            label="Buscar"
            debounce="300"
            v-model="searchInput"
          >
            <template v-slot:append>
              <q-icon :name="mdiMagnify" />
            </template>
          </q-input>
        </div>
      </q-card-section>
      <q-card-section class="row justify-between">
        <div
          class="col-lg-4 col-md-5 col-sm-12 column bg-white q-px-sm q-pt-sm rounded-borders"
        >
          <q-virtual-scroll
            class="col"
            :items="searchResults"
            v-slot="{ item: version }"
            :style="
              $q.platform.is.mobile
                ? { 'max-height': '25vh', 'min-height': '20vh' }
                : { 'max-height': '52vh', 'min-height': '45vh' }
            "
          >
            <q-item
              :key="version.id"
              :active="selectedVersion && version.id === selectedVersion.id"
              active-class="text-teal bg-teal-1"
              clickable
              @click="selectedVersion = version"
            >
              <q-item-section>
                <q-item-label>{{ version.id }}</q-item-label>
                <q-item-label
                  caption
                  :class="version.description === '' ? 'text-italic' : ''"
                  >{{
                    version.description !== ''
                      ? version.description
                      : 'Sem descrição'
                  }}</q-item-label
                >
              </q-item-section>
              <q-item-section side top>
                <q-item-label caption>{{
                  timeDistance(version.updated)
                }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-virtual-scroll>
          <div class="q-pa-sm text-center">
            <q-btn round :icon="mdiPlusCircleOutline" class="self-center" flat>
              <q-menu anchor="center middle" self="center middle">
                <q-form class="column" @submit.prevent="uploadVersion">
                  <div class="text-h6 q-pa-sm text-primary col self-center">
                    Salvar Versão Atual
                  </div>
                  <q-separator inset />
                  <div class="q-gutter-sm q-pa-sm col">
                    <q-input
                      dense
                      label="ID"
                      filled
                      v-model="newVersion.id"
                      color="teal-5"
                      required
                      class="col"
                      hint="Identificador da versão"
                      :loading="persisting"
                    >
                      <template v-slot:after>
                        <q-btn
                          :icon="mdiRefresh"
                          @click="newVersion.id = uuid4()"
                          round
                          size="sm"
                          flat
                        >
                          <q-tooltip anchor="center right" class="bg-teal">
                            Código automático
                          </q-tooltip>
                        </q-btn>
                      </template>
                    </q-input>
                    <q-input
                      dense
                      label="Descrição"
                      filled
                      color="teal-5"
                      v-model="newVersion.description"
                      class="col"
                    >
                    </q-input>
                    <q-btn
                      label="OK"
                      color="teal-5"
                      type="submit"
                      v-close-popup
                    />
                    <q-btn v-close-popup label="cancelar" flat color="teal-5" />
                  </div>
                </q-form>
              </q-menu>
            </q-btn>
          </div>
        </div>
        <div
          class="col-lg-7 col-md-6 col-xs-12 q-pa-md bg-white rounded-borders q-mt-xs-md q-mt-md-none overflow-hidden"
        >
          <template v-if="selectedVersion !== null">
            <div class="row justify-between q-mb-md">
              <div class="col">
                <div class="text-h6">
                  {{
                    // @ts-ignore
                    selectedVersion.id
                  }}
                </div>
                <div class="text-caption">
                  {{
                    // @ts-ignore
                    selectedVersion.description
                  }}
                </div>
              </div>
              <div class="col-auto q-gutter-sm">
                <q-btn
                  round
                  :icon="mdiCloudDownload"
                  v-if="installable"
                  @click="
                    // @ts-ignore
                    emit('install-request', selectedVersion)
                  "
                  color="teal"
                />
                <q-btn
                  round
                  flat
                  :icon="mdiDelete"
                  @click="
                    performAction(deleteVersion, [selectedVersion?.id || ''], {
                      title: 'Deletar Versão',
                      question:
                        'Tem certeza que deseja deletar a versão ' +
                        selectedVersion?.id +
                        '?',
                    })
                  "
                  :loading="deleting"
                />
              </div>
            </div>
            <slot :version="selectedVersion" />
          </template>
          <div
            class="text-grey-6 text-center text-no-wrap fit relative-position q-py-sm"
            v-else
          >
            <div class="absolute-center">Selecione uma versão</div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions class="native-mobile-hide" align="center">
        <q-btn label="VOLTAR" flat color="secondary" @click="show = false" />
      </q-card-actions>
    </q-card>
    <ConfirmActionDialog
      :confirm="confirm"
      :cancel="cancel"
      v-model="isRevealed"
      v-if="isRevealed"
    >
      <template #title>{{ actionDialogState?.title }}</template>
      <template #question>
        {{ actionDialogState?.question }}
      </template>
    </ConfirmActionDialog>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, toRefs, reactive, computed } from 'vue';
import { v4 as uuid4 } from 'uuid';
import { useArrayFilter } from '@vueuse/core';
import {
  mdiCloudDownload,
  mdiDelete,
  mdiPlusCircleOutline,
  mdiRefresh,
  mdiMagnify,
} from '@quasar/extras/mdi-v6';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import { useSessionStore } from 'src/stores/session';
import { useProfileVersions } from 'src/composables/profile-versions';
import { usePerformActionDialog } from 'src/composables/actions';
import useFirebase from 'src/services/firebase';
import type { ProfileConverter } from 'src/composables/profile-versions';
import ConfirmActionDialog from './ConfirmActionDialog.vue';
import { timeDistance } from 'src/utils/dates';
import { useLoading } from 'src/composables/loading';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    collection: string;
    data: unknown;
    installable: boolean;
    converter?: ProfileConverter<unknown>;
  }>(),
  { title: 'Versões' },
);
const { title, collection, data, converter, modelValue } = toRefs(props);

const emit = defineEmits<{
  (e: 'install-request', version: Robot.ProfileVersion<unknown>): void;
  (e: 'version-saved'): void;
  (e: 'update:modelValue', value: boolean): void;
}>();

const show = computed({
  get() {
    return modelValue.value;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const session = useSessionStore();
const { robot, competitionId } = storeToRefs(session);
const {
  versions = ref([]),
  persistVersion: _persistVersion,
  deleteVersion: _deleteVersion,
} = useProfileVersions(
  useFirebase().db,
  collection.value,
  // @ts-ignore
  robot,
  competitionId,
  converter.value,
  // TODO: implementar tratamento de erros do Firebase
);
const [persistVersion, persisting] = useLoading(_persistVersion);
const [deleteVersion, deleting] = useLoading(_deleteVersion);

const newVersion = reactive({ id: '', description: '' });
async function uploadVersion(): Promise<void> {
  await persistVersion(data.value, newVersion.id, newVersion.description);
  newVersion.id = '';
  newVersion.description = '';
  emit('version-saved');
}

const selectedVersion = ref<Robot.ProfileVersion<unknown>>();

const searchInput = ref<string>('');
const searchResults = useArrayFilter(
  // @ts-ignore
  versions,
  (version) =>
    version.description?.includes(searchInput.value) ||
    version.id.includes(searchInput.value),
);

const {
  isRevealed,
  performAction,
  confirm,
  cancel,
  state: actionDialogState,
} = usePerformActionDialog();

const $q = useQuasar();
</script>
