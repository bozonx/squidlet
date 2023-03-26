//import * as fs from 'fs';
const fs = require('fs');

import Main from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/Main.js';
import {eachFileRecursively, isExists, makeModuleName} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/buildSet/starterMc/helpers.js';


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

    if (!isExists(hostDir)) {
      this.main.log.error(
        `Can't read dir "${hostDir}". Maybe it doesn't exist or you don't have FAT32 partition, ` +
        `in this case run: E.flashFatFS({ format: true });`
      );

      return;
    }

    eachFileRecursively(hostDir, (pathToFile: string) => {
      const fileContent: string = fs.readFileSync(pathToFile) as any;
      const moduleName: string = makeModuleName(pathToFile, hostDir, 'host');

      this.main.log.info('--> load Module', moduleName);

      Modules.addCached(moduleName, fileContent);
    });

  }

}
