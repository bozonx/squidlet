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

import Sys from '../../../host/src/app/interfaces/dev/Sys';


export default class StorageDev implements Sys {
  mkdir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fn = fs.mkdirSync as (path: string) => boolean;
      const result: boolean = fn(path);

      if (result) return resolve();

      reject();
    });
  }

  async readdir(path: string): Promise<string[]> {
    try {
      return (fs.readdirSync as (path: string) => string[])(path);
    } catch (err) {
      // if directory wasn't found
      throw new Error(`Directory "${path}" couldn't be listed. ${String(err)}`);
    }
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

  exists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      const fn = (fs.statSync as any) as (path: string) => object | undefined;
      const result: object | undefined = fn(path);

      if (result) return resolve(true);

      resolve(false);
    });
  }
}
