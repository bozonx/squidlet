//import * as fs from 'fs';

import FsDev from '../../platforms/squidlet-esp32/dev/Fs.dev';


export default class Starter {
  private readonly fs: FsDev = new FsDev();

  constructor() {

  }

  async start() {
    console.log(11111111111, this.fs.readdir('/'));
  }

}
