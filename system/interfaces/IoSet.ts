import {Primitives} from './Types';
import System from '../System';


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
  init(system: System): Promise<void>;
  getInstance<T extends IoSetInstance>(ioName: string): T;
  destroy(): void;



  //getInstance<T>(devName: string): T;
}
