import fs from 'node:fs/promises'
import {exec} from 'node:child_process'
import type {ExecException} from 'child_process'
import {promisify} from 'node:util'
import {DEFAULT_WS_CTRL_PORT, LOCAL_HOST} from '../types/constants.js'


// TODO: add start of io-server
// TODO: add log - read logs from remote server
// TODO: add call api
// TODO: add restart/reboot/info of remote server - it is just sugar of api call

export const execPromise = promisify(exec)


export interface SquidletCtlParams {
  host: string,
  port: number,
}

export const dockerContainerName = 'bozonx:squidlet'
export const serviceName = 'squidlet'


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
    let fileContentBuffer: Buffer

    try {
      fileContentBuffer = await fs.readFile(pkgPath)
    }
    catch (e) {
      console.error(`ERROR: can't read the file: ${e}`)

      return
    }


    // TODO: передать не распаковывая в squidlet потому что он может не иметь доступа


    console.log(1111, pkgPath)
  }


  ///// systemd
  async status() {
    const cmd = `systemctl status ${serviceName}`

    await this.execCmd(cmd)
  }

  async restart() {
    const cmd = `sudo systemctl restart ${serviceName}`

    await this.execCmd(cmd)
  }

  async start() {
    const cmd = `sudo systemctl start ${serviceName}`

    await this.execCmd(cmd)
  }

  async stop() {
    const cmd = `sudo systemctl stop ${serviceName}`

    await this.execCmd(cmd)
  }

  async enable() {
    const cmd = `sudo systemctl enable ${serviceName}`

    await this.execCmd(cmd)
  }

  async disable() {
    const cmd = `sudo systemctl disable ${serviceName}`

    await this.execCmd(cmd)
  }


  private async execCmd(cmd: string) {
    try {
      const {stdout, stderr} = await execPromise(cmd)

      if (stderr) console.error(stderr)

      if (stdout) console.log(stdout)
    }
    catch (e) {
      console.error(e)
    }
  }

}
