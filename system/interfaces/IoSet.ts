import {Primitives} from './Types';


export interface IoDefinition {
  [index: string]: string[];
}


export default interface IoSet {
  init(ioDefinitions: IoDefinition): Promise<void>;
  getInstance<T>(ioName: string): T;
  destroy(): void;



  //getInstance<T>(devName: string): T;
}
