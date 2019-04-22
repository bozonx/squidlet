import {Primitives} from './Types';


export interface IoDefinition {
  [index: string]: string[];
}

export interface IoSetInstance {
  // method name: method()
  [index: string]: (...args: any[]) => Promise<any>;
}

export interface IoSetInstances {
  // io name
  [index: string]: IoSetInstance;
}


export default interface IoSet {
  init(ioDefinitions: IoDefinition): Promise<void>;
  getInstance<T extends IoSetInstance>(ioName: string): T;
  destroy(): void;



  //getInstance<T>(devName: string): T;
}
