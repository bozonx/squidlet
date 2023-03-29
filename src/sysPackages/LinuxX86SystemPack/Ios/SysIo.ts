import * as childProcess from 'child_process';
import {ExecException} from 'child_process';

import SysIo from '../../../../../../squidlet/__old/system/interfaces/io/SysIoType';
import SysInfo from '../../../../../../__old/system/interfaces/SysInfoIo';
import {SysConfig} from '../../../../../../squidlet/__old/system/interfaces/io/SysIoType';
import {AppType} from '../../../../../../__old/system/interfaces/AppType';


let config: SysConfig | undefined;


export default class SysIo implements SysIo {
  async configure(configParams: SysConfig): Promise<void> {
    config = {
      ...config,
      ...configParams,
    };
  }

  /**
   * It just exits script. And starter has to restart it.
   */
  async exit(code: number = 0) {
    if (config && config.exit) {
      // call starter's exit
      return config.exit(code);
    }
    // or just exit if doesn't set
    process.exit(code);
  }

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
