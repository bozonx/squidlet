import {ENCODE} from '../../system/constants';

const uart = require('uart');

import SerialIo, {SerialDefinition, SerialEvents, SerialParams} from 'system/interfaces/io/SerialIo';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {AnyHandler} from 'system/lib/IndexedEvents';
import {callPromised} from '../../system/lib/common';


type SerialItem = [
  // lowjs uart instance
  any,
  IndexedEventEmitter<AnyHandler>
];

enum ItemPostion {
  serialPort,
  events,
}

let portParams: {[index: string]: SerialParams} = {};
let unnamedPortNumIndex = 0;


export default class Serial implements SerialIo {
  private readonly instances: {[index: string]: SerialItem} = {};


  async configure(newDefinition: SerialDefinition) {
    portParams = newDefinition.ports;
  }

  async newPort(portNum: number | undefined, paramsOverride: SerialParams): Promise<number> {
    const resolvedPortNum = this.resolvePortNum(portNum);

    if (!this.instances[resolvedPortNum]) {
      this.instances[resolvedPortNum] = await this.makePortItem(resolvedPortNum, paramsOverride);
    }

    return resolvedPortNum;
  }

  async destroy(): Promise<void> {
    for (let portNum of Object.keys(this.instances)) {
      this.destroyPort(Number(portNum));
    }
  }

  async destroyPort(portNum: number): Promise<void> {
    // TODO: may be close stream ???
    //await callPromised(this.instances[portNum][ItemPostion.serialPort].close);
    // TODO: remove handlers???
    this.instances[portNum][ItemPostion.events].destroy();
    delete this.instances[portNum];
  }

  async onData(portNum: number, handler: (data: string | Uint8Array) => void): Promise<number> {
    // TODO: add
  }
  async onError(portNum: number, handler: (err: string) => void): Promise<number> {
    // TODO: add
  }

  // write binary data
  async write(portNum: number, data: Uint8Array): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, Buffer.from(data));
  }

  // Print to the serial port - without a line break
  async print(portNum: number, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, data, ENCODE);
  }

  // Print a line to the serial port with a newline (\r\n) at the end of it.
  async println(portNum: number, data: string): Promise<void> {
    await callPromised(this.getItem(portNum)[ItemPostion.serialPort].write, `${data}\n`, ENCODE);
  }

  async removeListener(portNum: number, eventName: SerialEvents, handlerIndex: number): Promise<void> {

  }


  private async makePortItem(portNum: number, paramsOverride: SerialParams): Promise<SerialItem> {

    // let stream = new uart.UART({
    //   pinRX: 3,
    //   pinTX: 1,
    //   baud: 115200
    // });

    //stream.write('LED toggled\n');
  }

  private resolvePortNum(portNum: number | undefined): number {
    if (typeof portNum === 'number') return portNum;

    unnamedPortNumIndex++;

    return unnamedPortNumIndex;
  }
}
