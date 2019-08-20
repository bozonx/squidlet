import * as childProcess from 'child_process';
import {ExecException} from 'child_process';

import SysIo from '../../system/interfaces/io/SysIo';


export default class Sys implements SysIo {
  /**
   * It just exits script. And starter has to restart it.
   */
  async restart() {
    process.exit(0);
  }

  async reboot() {
    childProcess.exec('reboot', (error: ExecException | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(error);

        return console.error(stderr);
      }

      console.info(stdout);
    });
  }

}
