import { defineStore } from 'pinia';

export type Parameter = {
  class: DataClass;
  name: string;
  value: unknown;
};

export type DataClass = {
  name: string;
  parameters: Parameter[];
};

export const useRobotParameters = defineStore('robotParameters', {
  state: () => ({
    dataClasses: [] as DataClass[],
  }),

  getters: {
    getDataClass: (state) => {
      return (className: string) =>
        state.dataClasses.find((d) => d.name === className);
    },

    getParameter: (state) => {
      return (className: string, parameterName: string) => {
        const dataClass = state.dataClasses.find((d) => d.name === className);
        if (!dataClass) return undefined;

        return dataClass.parameters.find((p) => p.name === parameterName);
      };
    },
  },

  actions: {
    addClass(name: string) {
      if (this.getDataClass(name) === undefined) {
        this.dataClasses.push({ name, parameters: [] });
      }
    },

    addParameter(className: string, parameterName: string, value: unknown) {
      this.addClass(className);
      const dataClass = this.getDataClass(className);

      if (dataClass === undefined) return;

      const parameter = dataClass.parameters.find(
        (p) => p.name === parameterName
      );

      if (parameter === undefined) {
        dataClass.parameters.push({ class: dataClass, name: parameterName, value });
      } else {
        parameter.value = value;
      }
    },
  },
});
