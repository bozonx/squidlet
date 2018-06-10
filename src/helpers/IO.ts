import * as uniqid from 'uniqid';

const fs = require('fs');
const { yamlToJs } = require('./helpers');


export default class System {
  async loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
    const yamlContent: string = await this.getFileContent(fullPath);

    return yamlToJs(yamlContent);
  }

  loadYamlFileSync(fullPath: string): object {
    const yamlContent = fs.readFileSync(fullPath, 'utf8');

    return yamlToJs(yamlContent);
  }

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
