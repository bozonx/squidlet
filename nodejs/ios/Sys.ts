import * as childProcess from 'child_process';
import {ExecException} from 'child_process';

import SysIo from 'system/interfaces/io/SysIo';
import SysInfo from '../../system/interfaces/SysInfo';


export default class Sys implements SysIo {
  // /**
  //  * It just exits script. And starter has to restart it.
  //  */
  // async restart() {
  //   process.exit(0);
  // }

  reboot(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      childProcess.exec('reboot', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  shutdown(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      childProcess.exec('shutdown', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  async info(): Promise<SysInfo> {
    return {};
  }

}
