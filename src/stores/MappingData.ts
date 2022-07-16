import { defineStore } from 'pinia';

export type RegMap = {
    id:number;
    EncMedia: number;
    Time: number;
    EncRight:number;
    EncLeft: number;
    Status: number;
};

export const mappingStore = defineStore('mapping',{
    state: () => {
        return {
            RegToSend: 0,
            Mapregs: []
        };

    },
    getters:{
        getRegToSend: (state) => {
            return state.RegToSend;
        },
        getMapRegsString: (state) => {
            return (sep: string) => {
                let stringReg = '';
                state.Mapregs.forEach((reg) => {
                    stringReg += reg.id.toString() + ',' + reg.Time.toString() + ',' + reg.EncMedia.toString() + ',' + reg.EncLeft.toString() + ',' + reg.EncRight.toString() + ',' + reg.Status.toString();
                    stringReg += sep;
                });
                stringReg = stringReg.substring(0,stringReg.length-1);
                return stringReg;

            };
        },
        getRegString: (state) => {
            return (pos: number) => {
                let stringReg = '';
                let reg = undefined;
                if(state.Mapregs.length > pos) reg = state.Mapregs.at(pos);
                if(reg !== undefined)  {
                    stringReg += reg.id.toString() + ',' + reg.Time.toString() + ',' + reg.EncMedia.toString() + ',' + reg.EncLeft.toString() + ',' + reg.EncRight.toString() + ',' + reg.Status.toString();
                }
                return stringReg;
            };
        },
        getIDRegString: (state) => {
            return (id: number) => {
                let stringReg = '';
                const reg = state.Mapregs.find((r) => r.id === id);
                if(reg !== undefined)  {
                    stringReg += reg.id.toString() + ',' + reg.Time.toString() + ',' + reg.EncMedia.toString() + ',' + reg.EncLeft.toString() + ',' + reg.EncRight.toString() + ',' + reg.Status.toString();
                }
                return stringReg;
            };
        },
        getReg: (state) => {
            return (id: number) => state.Mapregs.find((r) => r.id === id);
        },
        TotalRegs: (state) => {
            return state.Mapregs.length;
        },
    },
    actions: {
        setRegToSend(RegPos:number){
            this.RegToSend = RegPos;
        },
        addReg(Reg:string){
            const mapData = Reg.split(',');
            const newReg = {} as RegMap;
            newReg.id = this.Mapregs.length + 1;
            newReg.EncMedia = parseInt(mapData[2]);
            newReg.Time = parseInt(mapData[1]);
            newReg.Status = parseInt(mapData[5]);
            newReg.EncLeft = parseInt(mapData[3]);
            newReg.EncRight = parseInt(mapData[4]);
            this.Mapregs.push(newReg);
        },
        addRegObj(Reg:RegMap){
            Reg.id = this.Mapregs.length + 1;
            this.Mapregs.push(Reg);
        },
        clearMap(){
            while(this.Mapregs.length > 0)
            {
                this.Mapregs.pop();
            }
        },
        deleteReg(id:number){
            if(this.Mapregs.findIndex((r) => r.id === id) !== -1)
            {
                const index = this.Mapregs.findIndex((r) => r.id === id);
                this.Mapregs.splice(index,1);
            }

        }
    },
});
