//import * as fs from 'fs';

import Main from './Main';


export default class Starter {
  private readonly main: Main;


  constructor(main: Main) {
    this.main = main;
  }


  async start() {
    const fs = require('fs');

    console.log(33333333, fs.readdirSync('/'));

    //const result: string[] = await this.fs.readdir('/');

    //this.logEmitter.log(22222222, result);
  }

}
