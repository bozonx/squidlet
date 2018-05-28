

// TODO: сделать очередь
// TODO: сделать поддержку poling
// TODO: сделать поддержку int


export default class I2c {
  constructor() {

  }

  write(bus: number, address: string, dataAddr: number, data: Buffer): Promise<void> {
    // TODO: наверное дожидаться  таймаута соединения и обрывать
  }

  read(bus: number, address: string, dataAddr: number): Promise<Buffer> {

  }

  listen(bus: number, address: string, dataAddr: number) {

  }

  unlisten() {
    // TODO: !!!!
  }

  request(bus: number, address: string, dataAddr: number, data: Buffer): Promise<Buffer> {
    // Write and read - но не давать никому встать в очередь
  }

  writeBlock(bus: number, address: string, dataAddr: number, data: Buffer, hasNext: boolean): Promise<void> {
    // TODO: послать один блок - нужно чтобы не забить всю память большими данными
  }

  readBlock(bus: number, address: string, dataAddr: number): Promise<Buffer> {
    // TODO: прочитать один блок - нужно чтобы вручную считываь блоки чтобы не забивать память
  }

  listenBlock(bus: number, address: string, dataAddr: number) {
    // TODO: приходит по одному блоку
  }

  unlistenBlock() {
    // TODO: !!!!
  }

  listenData(bus: number, address: string, dataAddr: number, handler: (data: Buffer) => void) {
    // TODO: склеить блоки. См в заголовке есть ли ещё данные
  }

  unlistenData() {
    // TODO: !!!!
  }

  writeData(bus: number, address: string, dataAddr: number, data: Buffer): Promise<void> {
    // TODO: разбить данные на блоки и отослать поочереди - ставить в конец очереди
  }

  requestData(bus: number, address: string, dataAddr: number): Promise<Buffer> {
    // TODO: Write and read - но не давать никому встать в очередь
  }

}
