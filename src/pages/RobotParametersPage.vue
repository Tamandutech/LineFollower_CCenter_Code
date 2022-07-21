<template>
  <q-page>
    <div class="q-pa-md">
      <q-table
        grid
        card-container-class="row wrap justify-start items-baseline"
        title="Classes"
        :rows="classes.dataClasses"
        :columns="columns"
        row-key="name"
        :filter="filter"
        hide-header
        hide-bottom
      >
        <template v-slot:top-left>
          <q-btn
            :loading="loadingParameters"
            :icon="mdiRefreshCircle"
            @click="loadParameters"
            color="primary"
          >
            <template v-slot:loading>
              <q-spinner-hourglass class="on-center" />
            </template>
          </q-btn>
        </template>

        <template v-slot:top-right>
          <q-input
            borderless
            dense
            debounce="300"
            v-model="filter"
            placeholder="Procurar"
          >
            <template v-slot:append>
              <q-icon :name="mdiDatabaseSearch" />
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4" style="height: 100%">
            <q-card>
              <q-card-section class="text-center">
                <strong>{{ props.row.name }}</strong>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <q-table :rows="props.row.parameters" hide-header flat>
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td key="name" :props="props">
                        <strong>{{ props.row.name }}</strong>
                      </q-td>

                      <q-td key="value" :props="props">
                        {{ props.row.value }}
                        <q-popup-edit
                          :model-value="props.row.value"
                          @save="
                            (val, initialValue) =>
                              cmdParam.param_set(props.row, val, initialValue)
                          "
                          :title="props.row.name"
                          buttons
                          v-slot="scope"
                        >
                          <q-input
                            type="number"
                            v-model="scope.value"
                            dense
                            autofocus
                          />
                        </q-popup-edit>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </div>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script lang="ts">
import { useRobotParameters } from 'src/stores/robotParameters';
import cmdParam from './../utils/cmdParam';
import { ref, computed, watch, defineComponent } from 'vue';
import { useQuasar } from 'quasar';
import { mdiDatabaseSearch, mdiRefreshCircle } from '@quasar/extras/mdi-v6';

export default defineComponent({
  name: 'IndexPage',

  setup() {
    const loadingParameters = ref(false);

    function loadParameters() {
      loadingParameters.value = true;
      cmdParam.param_list();

      setTimeout(() => {
        // we're done, we reset loading state
        loadingParameters.value = false;
      }, 10000);
    }

    const classes = useRobotParameters();

    classes.$onAction(() => {
      loadingParameters.value = false;
    }, true);

    const $q = useQuasar();

    const filter = ref('');

    return {
      mdiDatabaseSearch,
      mdiRefreshCircle,
      classes,

      filter,
      loadingParameters,
      loadParameters,

      cmdParam,

      columns: [
        { name: 'name', label: 'Name', field: 'name' },
        { name: 'calories', label: 'Calories (g)', field: 'calories' },
      ],

      cardContainerClass: computed(() => {
        return $q.screen.gt.xs
          ? 'grid-masonry grid-masonry--' + ($q.screen.gt.sm ? '3' : '2')
          : null;
      }),

      rowsPerPageOptions: computed(() => {
        return $q.screen.gt.xs ? ($q.screen.gt.sm ? [3, 6, 9] : [3, 6]) : [3];
      }),
    };
  },

  mounted() {
    // console.log('Buscando parâmetros...');
    // cmdParam.param_list();
  },
});
</script>

<!-- <style lang="sass">
.grid-masonry
  flex-direction: column
  height: 700px

  &--2
    > div
      &:nth-child(2n + 1)
        order: 1
      &:nth-child(2n)
        order: 2

    &:before
      content: ''
      flex: 1 0 100% !important
      width: 0 !important
      order: 1
  &--3
    > div
      &:nth-child(3n + 1)
        order: 1
      &:nth-child(3n + 2)
        order: 2
      &:nth-child(3n)
        order: 3

    &:before,
    &:after
      content: ''
      flex: 1 0 100% !important
      width: 0 !important
      order: 2
</style> -->