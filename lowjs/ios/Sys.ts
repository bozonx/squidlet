import SysIo from 'system/interfaces/io/SysIo';


export default class Sys implements SysIo {
  // /**
  //  * It just exits script. And starter has to restart it.
  //  */
  // async restart() {
  //   process.exit(0);
  // }

  reboot(): Promise<void> {
    throw new Error(`Don't know how to reboot`);
  }

}
