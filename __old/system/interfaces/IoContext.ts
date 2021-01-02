import Logger from '../../../../squidlet-networking/src/interfaces/Logger';
import IoItem from './IoItem';


export default interface IoContext {
  log: Logger;
  getIo<T extends IoItem>(ioName: string): T;
  getNames(): string[];
}
