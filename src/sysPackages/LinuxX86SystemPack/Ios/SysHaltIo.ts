import {exec, ExecException} from 'node:child_process';
import SysHaltIoType from '../../../types/io/SysHaltIoType.js'
import {WAIT_BEFORE_HALT_MS} from '../../../types/contstants.js'


export default class SysHaltIo implements SysHaltIoType {
  async exit(code: number = 0) {
    setTimeout(() => {
      process.exit(code)
    }, WAIT_BEFORE_HALT_MS)
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
