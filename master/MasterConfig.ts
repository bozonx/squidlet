import Main from './Main';
import Platforms from './interfaces/Platforms';

export default class MasterConfig {
  private readonly main: Main;

  constructor(main: Main) {
    this.main = main;
  }

  getPlatformConfig(platFormName: Platforms) {

  }

}
