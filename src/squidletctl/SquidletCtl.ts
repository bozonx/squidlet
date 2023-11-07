import {DEFAULT_WS_CTRL_PORT, LOCAL_HOST} from '../types/contstants.js'


export interface SquidletCtlParams {
  host: string,
  port: number,
}


export class SquidletCtl {
  params: SquidletCtlParams

  constructor(rawParams: Partial<SquidletCtlParams>) {
    this.params = {
      host: LOCAL_HOST,
      port: DEFAULT_WS_CTRL_PORT,
      ...rawParams
    }
  }


  async installPackage(pkgPath: string) {
    console.log(1111, pkgPath)
  }

  async updateHost() {

  }

  async start() {

  }

  async stop() {

  }

  async enable() {

  }

  async disable() {

  }

  async installService() {

  }

  async uninstallService() {

  }

}
