import * as path from 'path';

import {APP_STARTER_FILE_NAME, SYSTEM_FILE_NAME} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from '../../nodejs/starters/Props';
import Os from '../../shared/Os';
import {listenScriptEnd} from '../../shared/helpers';
import StorageIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/StorageIo.js';
import ConsoleLogger from '../../system/ConsoleLogger';
import Logger from '../../../../squidlet-networking/src/interfaces/Logger';
import SysIo from '../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/SysIo.js';
import SolidStarter from '../../system/SolidStarter';
import HostConfig from '../../system/interfaces/HostConfig';


// interface SystemKind {
//   start(): Promise<void>;
//   destroy(): Promise<void>;
// }
// // AppStarter of System class
// type SystemKindClass = new (
//   ioSet: IoSet,
//   restartRequest: () => void,
//   logger?: Logger
// ) => SystemKind;


export default class SystemStarter {
  private readonly os: Os;
  private readonly props: Props;
  private readonly bareSystem: boolean;


  constructor(os: Os, props: Props, bareSystem: boolean = false) {
    this.props = props;
    this.os = os;
    this.bareSystem = bareSystem;
  }


  async start(solidStarterFileName: string, ioSet: IoSet) {

    // TODO: лучше то наверное использовать сразу файл а не dir
    // TODO: remake to AppStarter ???

    // use System if bareSystem is true or AppStarter if false
    //const fileName: string = (this.bareSystem) ? SYSTEM_FILE_NAME : APP_STARTER_FILE_NAME;
    //const systemKindFile = path.join(pathToSystemDir, fileName);
    const SolidStarterClass: new (ioSet: IoSet) => SolidStarter = this.os.require(solidStarterFileName).default;
    // TODO: resolve
    const ioServerMode: boolean = false;

    console.info(`===> Initializing app, using "${solidStarterFileName}"`);

    const systemKind: SolidStarter = new SolidStarterClass(ioSet);

    console.info(`===> Starting app`);

    const hostConfigOverride: HostConfig = {
      // TODO: resolve appType ???? или он зарезолвится ниже ???
      //appType: 'app',
    } as HostConfig;

    await systemKind.start(
      (code: number) => process.exit(code),
      hostConfigOverride,
      this.props.appWorkDir,
      this.props.uid,
      this.props.gid,
      this.props.argLogLevel,
      ioServerMode,
    );
  }

  //
  // // TODO: move upper ???
  // private listenDestroySignals(destroy: () => Promise<void>) {
  //   listenScriptEnd(() => this.gracefullyDestroyCb(destroy));
  // }
  //
  // // TODO: move upper ???
  // private gracefullyDestroyCb = async (destroy: () => Promise<void>) => {
  //   setTimeout(() => {
  //     console.error(`ERROR: App hasn't been gracefully destroyed during "${this.props.destroyTimeoutSec}" seconds`);
  //     this.os.processExit(3);
  //   }, this.props.destroyTimeoutSec * 1000);
  //
  //   try {
  //     await destroy();
  //     this.os.processExit(0);
  //   }
  //   catch (err) {
  //     console.error(err);
  //     this.os.processExit(2);
  //   }
  // }

  // private async configureStorage(ioSet: IoSet) {
  //   if (typeof this.props.uid === 'undefined' && typeof this.props.gid === 'undefined') return;
  //
  //   const storageIo = ioSet.getIo<StorageIo>('Storage');
  //   const sysIo: SysIo = ioSet.getIo<SysIo>('Sys');
  //
  //   await storageIo.configure({
  //     uid: this.props.uid,
  //     gid: this.props.gid,
  //     workDir: this.props.appWorkDir,
  //   });
  //   // make destroy before process.exit
  //   await sysIo.configure({
  //     exit: (code: number) => {
  //       this.destroy()
  //         .then(() => process.exit(code))
  //         .catch((e: Error) => {
  //           console.error(e);
  //           process.exit(code);
  //         });
  //     }
  //   });
  // }

}


// /**
//  * It just exits on restart request because this request is make on update
//  * and it needs to reload all the imports.
//  * You should restart the script in the external code e.g in a systemd service.
//  */
// private handleRestartRequest = () => {
//   process.exit(0);
// }
