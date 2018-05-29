import DevI2c from '../dev/I2c';
import { stringToHex } from '../helpers/helpres';

// TODO: сделать очередь
// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2c {
  constructor() {

  }

  write(bus: string, address: string, dataAddr: number = undefined, data: Buffer = undefined): Promise<void> {
    // TODO: наверное дожидаться  таймаута соединения и обрывать
    // TODO: если не указан dataAddr - использовать i2cWrite
    // TODO: если не указан data - использовать bus.writeQuick(addr, bit, cb)
    const hexAddr = stringToHex(address);
  }

  read(bus: string, address: string, dataAddr: number): Promise<Buffer> {

  }

  listen(bus: string, address: string, dataAddr: number) {

  }

  unlisten() {
    // TODO: !!!!
  }

  request(bus: string, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
    // Write and read - но не давать никому встать в очередь
  }

  writeBlock(bus: string, address: string, dataAddr: number, data: Buffer, hasNext: boolean): Promise<void> {
    // TODO: послать один блок - нужно чтобы не забить всю память большими данными


  }

  readBlock(bus: string, address: string, dataAddr: number): Promise<Buffer> {
    // TODO: прочитать один блок - нужно чтобы вручную считываь блоки чтобы не забивать память
  }

  listenBlock(bus: string, address: string, dataAddr: number) {
    // TODO: приходит по одному блоку
  }

  unlistenBlock() {
    // TODO: !!!!
  }

  listenData(bus: string, address: string, dataAddr: number, handler: (data: Uint8Array) => void) {
    // TODO: склеить блоки. См в заголовке есть ли ещё данные
  }

  unlistenData() {
    // TODO: !!!!
  }

  writeData(bus: string, address: string, dataAddr: number, data: Uint8Array): Promise<void> {
    // TODO: разбить данные на блоки и отослать поочереди - ставить в конец очереди
  }

  requestData(bus: string, address: string, dataAddr: number): Promise<Buffer> {
    // TODO: Write and read - но не давать никому встать в очередь
  }

}
