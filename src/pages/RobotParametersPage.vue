<template>
  <q-page>
    <div class="q-pa-md">
      <q-table grid :card-container-class="cardContainerClass" title="Classes" :rows="classes.dataClasses"
        :columns="columns" row-key="name" :filter="filter" hide-header hide-bottom>
        <template v-slot:top-right>

          <q-input borderless dense debounce="300" v-model="filter" placeholder="Procurar">
            <template v-slot:append>
              <q-icon :name="mdiDatabaseSearch" />
            </template>
          </q-input>

        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4">
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
                        <q-popup-edit :model-value="props.row.value"
                          @save="(val, initialValue) => updateValue(props.row, val, initialValue)"
                          :title="props.row.name" buttons v-slot="scope">
                          <q-input type="number" v-model="scope.value" dense autofocus />
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
import { Parameter, useRobotParameters } from 'src/stores/robotParameters';
import { ref, computed, watch, defineComponent } from 'vue';
import { useQuasar } from 'quasar'
import { mdiDatabaseSearch } from '@quasar/extras/mdi-v6';
import ws from './../ws';

export default defineComponent({
  name: 'IndexPage',
  // components: { ParametersComponent },

  setup() {
    const classes = useRobotParameters();

    // classes.$subscribe((mutation, state) => {
    //   console.log('mutation', mutation);
    //   console.log('state', state);
    // });

    function updateValue(row: Parameter, value: undefined, initialValue: undefined) {
      if (value !== initialValue) {
        console.log('updateValue', row, value, initialValue);
        ws.send('rmt "param_set ' + row.class.name + '.' + row.name + ' ' + value + '" -w');
        ws.send('rmt "param_get ' + row.class.name + '.' + row.name + '" -w');
      }
    }

    const $q = useQuasar()

    function getItemsPerPage() {
      if ($q.screen.lt.sm) {
        return 3
      }
      if ($q.screen.lt.md) {
        return 6
      }
      return 9
    }

    const filter = ref('')

    const pagination = ref({
      page: 1,
      rowsPerPage: getItemsPerPage()
    })

    watch(() => $q.screen.name, () => {
      pagination.value.rowsPerPage = getItemsPerPage()
    })

    return {
      mdiDatabaseSearch,

      classes,

      filter,

      updateValue,

      columns: [
        { name: 'name', label: 'Name', field: 'name' },
        { name: 'calories', label: 'Calories (g)', field: 'calories' }
      ],

      cardContainerClass: computed(() => {
        return $q.screen.gt.xs
          ? 'grid-masonry grid-masonry--' + ($q.screen.gt.sm ? '3' : '2')
          : null
      }),

      rowsPerPageOptions: computed(() => {
        return $q.screen.gt.xs
          ? $q.screen.gt.sm ? [3, 6, 9] : [3, 6]
          : [3]
      }),
    }
  },

  created() {
    ws.onopen = () => {
      console.log('Conectado, buscando parâmetros...');
      ws.send('rmt param_list -w');
    };

    ws.onmessage = (event) => {
      const received = JSON.parse(event.data) as { cmdExecd: string, data: string }
      console.log('Recebido:', received);

      if (received.cmdExecd.includes('param_list')) {
        console.log('Parâmetros recebidos');

        let lines: string[] = received.data.split('\n');

        let qtdParams = Number(lines[0].substring(lines[0].indexOf(':') + 2));
        console.log('Qtd de parâmetros: ' + qtdParams);

        for (let index = 0; index < qtdParams; index++) {
          let className: string = lines[index + 1].substring(
            lines[index + 1].indexOf('-') + 2,
            lines[index + 1].indexOf('.')
          );

          let paramName: string = lines[index + 1].substring(
            lines[index + 1].indexOf('.') + 1,
            lines[index + 1].indexOf(':')
          );

          let paramValue: string = lines[index + 1].substring(
            lines[index + 1].indexOf(':') + 2
          );

          this.classes.addParameter(className, paramName, paramValue);

          console.log(
            'ClassName: ' +
            className +
            ', ParamName: ' +
            paramName +
            ', ParamValue: ' +
            paramValue
          );
        }
      }

      else if (received.cmdExecd.includes('param_get')) {
        console.log('Parâmetro recebido');

        let match = received.cmdExecd.match('param_get[ ]+(?<classe>[^.]*).(?<parametro>[^\"]*)');
        console.log(match);
        console.log('Classe: ' + match?.groups?.classe + ', Param: ' + match?.groups?.parametro + ', Value: ' + received.data);

        if (match?.groups?.classe === undefined || match?.groups?.parametro === undefined)
          return;

        this.classes.addParameter(match?.groups?.classe, match?.groups?.parametro, received.data);
      }

    };
  },
});
</script>

<style lang="sass">
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
</style>
