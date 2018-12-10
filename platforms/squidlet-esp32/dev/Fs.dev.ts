/**
 * It uses FAT32 file system on connected flash card.
 * Or you can use last 1mb of ESP32 flash by formatting it:
 *   try {
 *     fs.readdirSync();
 *   } catch (e) { //'Uncaught Error: Unable to mount media : NO_FILESYSTEM'
 *     console.log('Formatting FS - only need to do once');
 *     E.flashFatFS({ format: true });
 *   }
 *
 */


//import * as fs from 'fs';
const fs = require('fs');

import Fs, {Stats} from '../../../host/src/app/interfaces/dev/Fs';


export default class FsDev implements Fs {
  appendFile(path: string, data: string | Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.appendFileSync as (path: string, data: string | Uint8Array) => boolean;
      const result: boolean = fn(path, data);

      if (result) return resolve();

      reject();
    });
  }

  mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.mkdirSync as (path: string) => boolean;
      const result: boolean = fn(path);

      if (result) return resolve();

      reject();
    });
  }

  readdir(path: string): Promise<string[]> {
    let result: string[];

    console.log(3333333333)

    try {
      result = (fs.readdirSync as (path: string) => string[])(path);
    }
    catch (err) {
      // if directory wasn't found
      throw new Error(`Directory couldn't be listed. ${String(err)}`);
    }

    console.log(444444444, result)

    return Promise.resolve(result);
  }

  readFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const fn = fs.readFileSync as (path: string) => string | undefined;
      const result: string | undefined = fn(path);

      if (result) return resolve(result);

      reject(new Error(`file doesn't exist`));
    });
  }

  rmdir(path: string): Promise<void> {
    return this.unlink(path);
  }

  unlink(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.unlinkSync as (path: string) => boolean;
      const result: boolean = fn(path);

      if (result) return resolve();

      reject();
    });
  }

  writeFile(path: string, data: string | Uint8Array): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.writeFileSync as (path: string, data: string | Uint8Array) => boolean;
      const result: boolean = fn(path, data);

      if (result) return resolve();

      reject();
    });
  }

  stat(path: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
      const fn = (fs.statSync as any) as (path: string) => Stats | undefined;
      const result: Stats | undefined = fn(path);

      if (result) return resolve(result);

      reject();
    });
  }

  exists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      const fn = (fs.statSync as any) as (path: string) => object | undefined;
      const result: object | undefined = fn(path);

      if (result) return resolve(true);

      resolve(false);
    });
  }


  // additional

  async copyFile(src: string, dest: string): Promise<void> {
    // TODO: !!! можно создать новый и удалить старый файл

    return;
  }


  async rename(oldPath: string, newPath: string): Promise<void> {
    // TODO: можно удалить старый файл и создать новый с тем же содержимым
    //return fsPromises.rename(oldPath, newPath);
  }

  // TODO: add stat
  // stat(path: string): Promise<Stats> {
  //   return fsPromises.stat(path);
  // }


}
