declare namespace LFCommandCenter {
  export interface RobotResponse {
    cmdExecd: string;
    data: string;
  }
  export enum RobotStatus {
    CAR_IN_CURVE = 0,
    CAR_IN_LINE = 1,
    CAR_STOPPED = 2,
  }
  export type RegMap = {
    id: number;
    EncMedia: number;
    Time: number;
    EncRight: number;
    EncLeft: number;
    Status: RobotStatus;
  };
  export type DataClass = {
    name: string;
    parameters: LFCommandCenter.RobotParameter[];
  };
  export type RobotParameter = {
    class: DataClass;
    name: string;
    value: unknown;
  };
}
