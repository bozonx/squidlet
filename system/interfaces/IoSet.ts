import System from '../System';
import IoItem from './IoItem';


export default interface IoSet {
  init(system: System): Promise<void>;
  getInstance<T extends IoItem>(ioName: string): T;
  destroy(): void;
}
