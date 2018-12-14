import * as fs from 'fs';

import Main from './Main';
import {eachFileRecursivelly, makeModuleName} from './helpers';


declare const Modules: {
  addCached: (moduleName: string, content: string) => void;
  removeAllCached: () => void;
};


export default class Starter {
  private readonly main: Main;


  constructor(main: Main) {
    this.main = main;
  }


  async start() {
    const hostDir = `${this.main.config.rootDir}/${this.main.config.hostDir}`;

    // remove all the modules
    Modules.removeAllCached();

    eachFileRecursivelly(hostDir, (pathToFile: string) => {
      const fileContent: string = fs.readFileSync(pathToFile) as any;
      const moduleName: string = makeModuleName(pathToFile, hostDir, 'host');

      console.log(1111111, pathToFile);

      Modules.addCached(moduleName, fileContent);
    });

    console.log(33333333, fs.readdirSync('/'));

    //const result: string[] = await this.fs.readdir('/');

    //this.logEmitter.log(22222222, result);
  }

}
