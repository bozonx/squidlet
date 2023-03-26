import Logger from '../../../../squidlet-networking/src/interfaces/Logger';
import IoItem from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';


export default interface IoContext {
  log: Logger;
  getIo<T extends IoItem>(ioName: string): T;
  getNames(): string[];
}
