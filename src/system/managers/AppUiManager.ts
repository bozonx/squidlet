import type {System} from '../System.js'


// TODO: может вынести в серсис???


export class AppUiManager {
  private system: System
  // {appName: staticFilesPaths[]}
  private uis: Record<string, string[]> = {}

  constructor(system: System) {
    this.system = system
  }


  getUi(appName: string): string[] | undefined {
    return this.uis[appName]
  }

  registerUi(appName: string, staticFilesPaths: string[]) {
    if (this.uis[appName]) {
      throw new Error(`This UI of app "${appName}" is already registered`)
    }

    this.uis[appName] = staticFilesPaths
  }

}
