import {exec, ExecException} from 'node:child_process';
import SysHaltIoType from '../../../types/io/SysHaltIoType.js'


export default class SysHaltIo implements SysHaltIoType {
  /**
   * It just exits script.
   * It will wait 1 second to be able to return an answer
   */
  async exit(code: number = 0) {
    setTimeout(() => {
      process.exit(code)
    }, 1000)
  }

  async reboot() {
    // TODO: сделать это через пару сек чтобы успел прийти ответ
    return new Promise<void>((resolve, reject) => {
      exec('reboot', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        resolve();
      });
    });
  }

  async shutdown() {
    // TODO: сделать это через пару сек чтобы успел прийти ответ
    return new Promise<void>((resolve, reject) => {
      exec('shutdown', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        resolve()
      });
    });
  }

}
