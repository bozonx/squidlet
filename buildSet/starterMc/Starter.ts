import * as fs from 'fs';

import Main from './Main';
import {eachFileRecursivelly} from './helpers';


export default class Starter {
  private readonly main: Main;


  constructor(main: Main) {
    this.main = main;
  }


  async start() {
    const hostDir = `${this.main.config.rootDir}/${this.main.config.hostDir}`;

    eachFileRecursivelly(hostDir, (pathToFile: string) => {

    });

    console.log(33333333, fs.readdirSync('/'));

    //const result: string[] = await this.fs.readdir('/');

    //this.logEmitter.log(22222222, result);
  }

}
