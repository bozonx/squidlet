//import * as fs from 'fs';
import mkdirPLogic, {dirname} from './mkdirPLogic';

const fs = require('fs');


import Main from './Main';
import {FileRoots} from './config';
import {includes, isExists} from './helpers';


declare const global: {
  __flashFile: (root: FileRoots, relativeFilePath: string, content: string) => void;
};



export default class FlashingReceiver {
  private readonly main: Main;

  constructor(main: Main) {
    this.main = main;
  }

  init() {
    global.__flashFile = this.flashFile;
  }

  /**
   *
   * @param root {host} - root where will be placed the file
   * @param relativeFilePath {string} - file path include dirs relative root dir.
   * @param content {string} - content of file
   */
  private flashFile = async (root: FileRoots, relativeFilePath: string, content: string) => {
    const allowedRoots: string[] = Object.keys(this.main.config.systemDirs);

    if (!includes(allowedRoots, root)) {
      throw new Error(`Unregistered root`);
    }

    const systemDir = `${this.main.config.systemRoot}/${this.main.config.systemDirs[root]}`;
    const systemFilePath: string = `${systemDir}/${relativeFilePath}`;

    // create sub dir

    await mkdirPLogic(
      dirname(systemFilePath),
      async (fileOrDirPath: string) => isExists(fileOrDirPath),
      fs.mkdirSync
    );

    console.log(222222222, systemFilePath);

    fs.writeFileSync(systemFilePath, content);
  }

}
