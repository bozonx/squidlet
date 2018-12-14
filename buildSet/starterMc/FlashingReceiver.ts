import * as fs from 'fs';


import Main from './Main';
import {FileRoots} from './config';


declare const global: {
  FlashFile: (root: FileRoots, relativeFilePath: string, content: string) => void;
};



export default class FlashingReceiver {
  private readonly main: Main;

  constructor(main: Main) {
    this.main = main;
  }

  async init() {
    global.FlashFile = this.flashFile;
  }

  /**
   *
   * @param root {host} - root where will be placed the file
   * @param relativeFilePath {string} - file path include dirs relative root dir.
   * @param content {string} - content of file
   */
  private flashFile = (root: FileRoots, relativeFilePath: string, content: string) => {
    const allowedRoots: string[] = Object.keys(this.main.config.systemDirs);

    if (!allowedRoots.includes(root)) {
      throw new Error(`Unregistered root`);
    }

    const hostDir = `${this.main.config.systemRoot}/${this.main.config.systemDirs.root}`;
  }

}
