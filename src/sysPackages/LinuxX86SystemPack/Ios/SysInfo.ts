import childProcess from 'node:child_process';
import SysInfoIo from '../../../types/io/SysInfoIo.js'
import {MobileLevels, OS_ARCH, OsArch, SysPermanentInfo} from '../../../types/SysInfo.js'
import {ExecException} from 'child_process'


export default class SysInfo implements SysInfoIo {
  async getInfo(): Promise<SysPermanentInfo> {
    const {cpuNum, arch} = await this.getCpuInfo()
    const ramTotalMb = await this.getRamTotal()

    return {
      os: {
        type,
        name,
        version,
        uptimeSec,
      },
      system: {
        arch,
        cpuNum,
        ramTotalMb,
      },
      runtimeEnv: 'nodejs',
    }
  }


  private async getCpuInfo(): Promise<{ cpuNum: number, arch: OsArch }> {
    return new Promise((resolve, reject) => {
      childProcess.exec('lscpu -J', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        const data: any = JSON.parse(stdout)
        const osArchKeys = Object.keys(OS_ARCH)
        const archDoc: Record<string, string> | undefined = data.lscpu
          .find((el: Record<string, string>) => osArchKeys.includes(el.data))
        const cpuDoc: Record<string, string> | undefined = data.lscpu
          .find((el: Record<string, string>) => el.field === 'CPU(s):')

        resolve({
          cpuNum: (cpuDoc) ? Number(cpuDoc.data) : 0,
          arch: (archDoc) ? archDoc.data as OsArch : 'unknown',
        });
      })
    })
  }

  private async getRamTotal(): Promise<number> {

  }

}
