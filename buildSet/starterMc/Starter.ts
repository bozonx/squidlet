//import * as fs from 'fs';

//import FsDev from '../../platforms/squidlet-esp32/dev/Fs.dev';
import LogEmitter from './LogEmitter';


export default class Starter {
  private readonly logEmitter: LogEmitter;
  //private readonly fs: FsDev = new FsDev();

  constructor(logEmitter: LogEmitter) {
    this.logEmitter = logEmitter;
  }

  async start() {
    console.log(2222222222);
    const fs = require('fs');
    fs.readdirSync('/');

    console.log(33333333);

    //const result: string[] = await this.fs.readdir('/');

    //this.logEmitter.log(22222222, result);
  }

}
