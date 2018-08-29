import * as fs from 'fs';
import * as uniqid from 'uniqid';
import * as yaml from 'js-yaml';


export async function resolveFile(pathToDirOrFile: string, ext: string, indexFileName: string[]): string {
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

export async function writeFile(fileName: string, content: string) {
  // TODO: !!!!
}

export async function copyFile(fromFileName: string, toFileName: string) {
  // TODO: !!!!
}

export function generateUniqId(): string {
  return uniqid();
}

export function yamlToJs(yamlString: string): any {
  return yaml.safeLoad(yamlString);
}


// loadYamlFileSync(fullPath: string): object {
//   const yamlContent = fs.readFileSync(fullPath, 'utf8');
//
//   return yamlToJs(yamlContent);
// }

// /**
//  * Configure master to slaves connections.
//  */
// private configureMasterConnections() {
//
//   // TODO: use host config - там плоская структура
//
//   // findRecursively(this.system.host.config.devices, (item, itemPath): boolean => {
//   //   if (!_.isPlainObject(item)) return false;
//   //   // go deeper
//   //   if (!item.device) return undefined;
//   //   if (item.device !== 'host') return false;
//   //
//   //   const connection = {
//   //     host: itemPath,
//   //     type: item.address.type,
//   //     //bus: item.address.bus,
//   //     bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
//   //     address: item.address.address,
//   //   };
//   //
//   //   this.registerConnection(connection);
//   //
//   //   return false;
//   // });
// }
