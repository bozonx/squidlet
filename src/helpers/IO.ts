import * as fs from 'fs';
import { yamlToJs } from '../helpers/helpers';

import * as uniqid from 'uniqid';


export default class IO {
  // async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
  //   const yamlContent: string = await this.getFileContent(fullPath);
  //
  //   return yamlToJs(yamlContent);
  // }

  getFileContent(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, 'utf8', (err: NodeJS.ErrnoException, data: string) => {
        if (err) return reject(err);

        resolve(data);
      });
    });
  }

  generateUniqId(): string {
    return uniqid();
  }

}
