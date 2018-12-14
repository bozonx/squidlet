import * as fs from 'fs';

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


  async start() {
    const hostDir = `${this.main.config.rootDir}/${this.main.config.hostDir}`;

    // remove all the modules
    Modules.removeAllCached();

    eachFileRecursively(hostDir, (pathToFile: string) => {
      const fileContent: string = fs.readFileSync(pathToFile) as any;
      const moduleName: string = makeModuleName(pathToFile, hostDir, 'host');

      console.log(1111111, pathToFile, moduleName);

      Modules.addCached(moduleName, fileContent);
    });

  }

}
