import { defineStore } from 'pinia';

export const useMapping = defineStore('mapping', {
  state: () => {
    return {
      RegToSend: 0,
      options: [1],
      mapSending: false,
      mapSaving: false,
      mapStringDialog: '',
      mapSent: false,
      resendTries: 3,
      regsString: '',
      regsSent: true,
      mapRegs: Array<LFCommandCenter.RegMap>(),
    };
  },
  getters: {
    getRegToSend: (state) => {
      return state.RegToSend;
    },
    getMapRegsString: (state) => {
      return (sep: string) => {
        let stringReg = '';
        state.mapRegs.forEach((reg) => {
          stringReg += reg.id.toString() + ',' + reg.time.toString() + ',' + reg.encMedia.toString() + ',' + reg.encLeft.toString() + ',' + reg.encRight.toString() + ',' + reg.status.toString();
          stringReg += sep;
        });
        stringReg = stringReg.substring(0, stringReg.length - 1);
        return stringReg;
      };
    },
    getRegString: (state) => {
      return (pos: number) => {
        let stringReg = '';
        let reg = undefined;
        if (state.mapRegs.length > pos) reg = state.mapRegs.at(pos);
        if (reg !== undefined) {
          stringReg += reg.id.toString() + ',' + reg.time.toString() + ',' + reg.encMedia.toString() + ',' + reg.encLeft.toString() + ',' + reg.encRight.toString() + ',' + reg.status.toString();
        }
        return stringReg;
      };
    },
    getIDRegString: (state) => {
      return (id: number) => {
        let stringReg = '';
        const reg = state.mapRegs.find((r) => r.id === id);
        if (reg !== undefined) {
          stringReg += reg.id.toString() + ',' + reg.time.toString() + ',' + reg.encMedia.toString() + ',' + reg.encLeft.toString() + ',' + reg.encRight.toString() + ',' + reg.status.toString();
        }
        return stringReg;
      };
    },
    getReg: (state) => {
      return (id: number) => state.mapRegs.find((r) => r.id === id);
    },
    TotalRegs: (state) => {
      return state.mapRegs.length;
    },
  },
  actions: {
    setRegToSend(RegPos: number) {
      this.RegToSend = RegPos;
    },
    addReg(Reg: string) {
      const mapData = Reg.split(',');
      const newReg = {} as LFCommandCenter.RegMap;
      newReg.id = this.mapRegs.length + 1;
      newReg.encMedia = parseInt(mapData[2]);
      newReg.time = parseInt(mapData[1]);
      newReg.status = parseInt(mapData[5]);
      newReg.encLeft = parseInt(mapData[3]);
      newReg.encRight = parseInt(mapData[4]);
      this.mapRegs.push(newReg);
    },
    addRegObj(Reg: LFCommandCenter.RegMap) {
      Reg.id = this.mapRegs.length + 1;
      this.mapRegs.push(Reg);
    },
    clearMap() {
      while (this.mapRegs.length > 0) {
        this.mapRegs.pop();
      }
    },
    deleteReg(id: number) {
      if (this.mapRegs.findIndex((r) => r.id === id) !== -1) {
        const index = this.mapRegs.findIndex((r) => r.id === id);
        this.mapRegs.splice(index, 1);
      }
    },
  },
});
