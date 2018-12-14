//import * as fs from 'fs';
const fs = require('fs');

import Main from './Main';
import {eachFileRecursively, makeModuleName} from './helpers';


declare const Modules: {
  addCached: (moduleName: string, content: string) => void;
  removeAllCached: () => void;
};


export default class Starter {
  private readonly main: Main;


  constructor(main: Main) {
    this.main = main;
  }


  init() {
    const hostDir = `${this.main.config.systemRoot}/${this.main.config.systemDirs.host}`;

    // remove all the modules
    Modules.removeAllCached();

    eachFileRecursively(hostDir, (pathToFile: string) => {
      const fileContent: string = fs.readFileSync(pathToFile) as any;
      const moduleName: string = makeModuleName(pathToFile, hostDir, 'host');

      console.log(111111111111, pathToFile);

      this.main.log.info('--> load Module', moduleName);

      Modules.addCached(moduleName, fileContent);
    });

  }

}
