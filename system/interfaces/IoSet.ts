import System from '../System';


export interface IoDefinition {
  [index: string]: string[];
}

export interface IoSetInstance {
  // method name: method()
  [index: string]: (...args: any[]) => Promise<any>;
}


export default interface IoSet {
  init(system: System): Promise<void>;
  getInstance<T extends IoSetInstance>(ioName: string): T;
  destroy(): void;
}
