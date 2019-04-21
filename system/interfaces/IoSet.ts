
export interface IoDefinition {
  [index: string]: string[];
}


export default interface IoSet {
  init(ioDefinitions: IoDefinition): Promise<void>;
  getInstance<T>(ioName: string): T;

  // callMethod(ioName: string, methodName: string): Promise<any>;
  // addListener(ioName: string);
  // removeListener(ioName: string);

  //getInstance<T>(devName: string): T;
}
