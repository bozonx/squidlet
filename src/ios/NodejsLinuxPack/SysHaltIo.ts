import {exec, ExecException} from 'node:child_process';
import SysHaltIoType from '../../types/io/SysHaltIoType.js'
import {WAIT_BEFORE_HALT_MS} from '../../types/contstants.js'
import {IoIndex} from '../../types/types.js'
import {IoContext} from '../../system/Io/IoContext.js'
import {IoBase} from '../../system/Io/IoBase.js'


export const SysHaltIoIndex: IoIndex = (ctx: IoContext) => {
  return new SysHaltIo(ctx)
}


export default class SysHaltIo extends IoBase implements SysHaltIoType {
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
