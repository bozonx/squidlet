import * as fs from 'fs';
import {promises as fsPromises} from 'fs';

import Fs, {Stats} from '../../../host/src/app/interfaces/dev/Fs';


class FsDev implements Fs {
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
    return new Promise((resolve, reject) => {
      const fn = fs.readdirSync as (path: string) => string[] | undefined;
      const result: string[] | undefined = fn(path);

      if (result) return resolve(result);

      reject(new Error(`Directory couldn't be listed`));
    });
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

  copyFile(src: string, dest: string): Promise<void> {
    // TODO: !!! можно создать новый и удалить старый файл
  }


  rename(oldPath: string, newPath: string): Promise<void> {
    // TODO: можно удалить старый файл и создать новый с тем же содержимым
    return fsPromises.rename(oldPath, newPath);
  }

  // TODO: add stat
  // stat(path: string): Promise<Stats> {
  //   return fsPromises.stat(path);
  // }


}

export default new FsDev();
