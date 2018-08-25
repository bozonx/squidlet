import * as uniqid from 'uniqid';

const fs = require('fs');
const { yamlToJs } = require('./helpers');


export async function resolveFile(pathToDirOrDile: string, ext: string, indexFileName: string[]): string {
  // TODO: если это папка - то смотреть manifest.yaml / device.yaml | driver.yaml | service.yaml
  // TODO: расширение yaml - можно подставлять - необязательно указывать
}

export async function loadYamlFile(fullPath: string): Promise<{[index: string]: any}> {
  const yamlContent: string = await getFileContent(fullPath);

  return yamlToJs(yamlContent);
}

export function getFileContent(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err: NodeJS.ErrnoException, data: string) => {
      if (err) return reject(err);

      resolve(data);
    });
  });
}

export function generateUniqId(): string {
  return uniqid();
}

  // loadYamlFileSync(fullPath: string): object {
  //   const yamlContent = fs.readFileSync(fullPath, 'utf8');
  //
  //   return yamlToJs(yamlContent);
  // }
