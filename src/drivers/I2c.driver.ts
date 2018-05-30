import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpers';

// TODO: сделать очередь
// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2c {

  // TODO: выставить из конфига
  readonly blockLength: number = 32;

  constructor() {

  }

  read(bus: string, address: string, length: number): Promise<Uint8Array> {
    // TODO: прочитать один раз данные
  }

  write(bus: string, address: string, data: Uint8Array): Promise<void> {
    // TODO: наверное дожидаться  таймаута соединения и обрывать
    const hexAddr = stringToHex(address);
  }

  listen(bus: string, address: string, length: number, handler: (data: Uint8Array) => void) {
    // TODO: публикуем пришедшие данные заданной длинны
    // TODO: при установке первого листенера - запускается полинг или слушается int
  }

  /**
   * Read block(32 bytes) once on master.
   * It's need to control big data flow and e.g. write to disk one by one.
   */
  readBlock(bus: string, address: string): Promise<Uint8Array> {
    return this.read(bus, address, this.blockLength);
  }

  /**
   * Write block to slave from master.
   * It's need to control big data flow and e.g. read from disk one by one.
   */
  writeBlock(bus: string, address: string, data: Uint8Array): Promise<void> {
    if (data.length !== this.blockLength) {
      throw new Error(`Incorrect size of block: ${data.length}, it has to be ${this.blockLength}`);
    }

    return this.write(bus, address, data);
  }

  listenBlock(bus: string, address: string, handler: (data: Uint8Array) => void) {
    // TODO: приходящие блоки
  }

  writeData(bus: string, address: string, cmd: number, data: Uint8Array): Promise<void> {
    // TODO: разбить данные на блоки и отослать поочереди - ставить в конец очереди
  }

  listenData(bus: string, address: string, cmd: number, handler: (data: Uint8Array) => void) {
    // TODO: склеить блоки. См в заголовке есть ли ещё данные
  }

  unlisten(bus: string, address: string) {
    // TODO: !!!! тоже каксается хэндлеров для блоков и данных
  }

  // request(bus: string, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
  //   // Write and read - но не давать никому встать в очередь
  // }

  // requestData(bus: string, address: string): Promise<Buffer> {
  //   // TODO: Write and read - но не давать никому встать в очередь
  // }

}
