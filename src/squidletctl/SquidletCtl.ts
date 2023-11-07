import fs from 'node:fs/promises'
import {exec} from 'node:child_process'
import type {ExecException} from 'child_process'
import {DEFAULT_WS_CTRL_PORT, LOCAL_HOST} from '../types/contstants.js'


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
  async updateHost() {
    const cmd = `docker pull ${dockerContainerName}`

    await this.execCmd(cmd)
    await this.restart()
  }

  async installService() {
    //await this.execCmd(cmd)
  }

  async uninstallService() {
    //await this.execCmd(cmd)
  }

  async status() {
    const cmd = `systemctl status ${serviceName}`

    await this.execCmd(cmd)
  }

  async restart() {
    const cmd = `systemctl restart ${serviceName}`

    await this.execCmd(cmd)
  }

  async start() {
    const cmd = `systemctl start ${serviceName}`

    await this.execCmd(cmd)
  }

  async stop() {
    const cmd = `systemctl stop ${serviceName}`

    await this.execCmd(cmd)
  }

  async enable() {
    const cmd = `systemctl enable ${serviceName}`

    await this.execCmd(cmd)
  }

  async disable() {
    const cmd = `systemctl disable ${serviceName}`

    await this.execCmd(cmd)
  }


  private async execCmd(cmd: string) {
    return new Promise<void>((resolve, reject) => {
      exec(cmd, (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) console.error(error)
        else if (stderr) console.error(stderr)

        if (stdout) console.log(stdout)

        resolve()
      })
    })
  }

}
