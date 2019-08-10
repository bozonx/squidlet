import {SystemClassType} from '../shared/interfaces/SystemClassType';
import IoSetLocal from '../system/entities/IoSetLocal';
import IoSet from '../system/interfaces/IoSet';
import IoBackdoor from './IoBackdoor';


class McStarter {
  private pathToBundle: string;


  constructor(pathToBundle = '/envSet/system/System') {
    this.pathToBundle = pathToBundle;
  }


  async start() {
    const ioSet = new IoSetLocal();

    if (await this.isIoServerMode(ioSet)) {
      await this.startIoBackdoor(ioSet);
    }
    else {
      await this.startSystem(ioSet);
    }
  }


  private async isIoServerMode(ioSet: IoSet): boolean {
    // TODO: как определить режим io сервера - может создать файл и при загрузке его считать???
  }

  private async startSystem(ioSet: IoSet) {
    const SystemClass: SystemClassType = require(this.pathToBundle).default;
    const system = new SystemClass(ioSet);

    await system.start();
  }

  private async startIoBackdoor(ioSet: IoSet) {
    const ioBackdoor = new IoBackdoor(ioSet);

    await ioBackdoor.init();
  }

}
