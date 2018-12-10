//import * as fs from 'fs';

import FsDev from '../../platforms/squidlet-esp32/dev/Fs.dev';
import LogEmitter from './LogEmitter';


export default class Starter {
  private readonly logEmitter: LogEmitter;
  private readonly fs: FsDev = new FsDev();

  constructor(logEmitter: LogEmitter) {
    this.logEmitter = logEmitter;
  }

  async start() {
    this.logEmitter.log(22222222, await this.fs.readdir('/'));
  }

}
