import {System} from '../System.js'


export class AppUiManager {
  appName: string
  private system: System

  constructor(system: System, appName: string) {
    this.appName = appName
    this.system = system
  }


  registerRoot(uiFn: () => void) {

  }

}
