import childProcess from 'node:child_process';
import SysInfoIo from '../../../types/io/SysInfoIo.js'
import {MobileLevels, OS_ARCH, OsArch, RUNTIME_ENV, RuntimeEnv, SysPermanentInfo} from '../../../types/SysInfo.js'
import {ExecException} from 'child_process'


export default class SysInfo implements SysInfoIo {
  async getInfo(): Promise<SysPermanentInfo> {
    const {cpuNum, arch} = await this.getCpuInfo()
    const ramTotalMb = await this.getRamTotal()

    // TODO: cache result

    return {
      os: {
        // TODO: get type
        type: 'linux',
        // TODO: get naem
        name: '',
        // TODO: get version
        version: '',
      },
      system: {
        arch,
        cpuNum,
        ramTotalMb,
      },
      runtimeEnv: RUNTIME_ENV.nodejs as RuntimeEnv,
    }
  }

  async getUsedMem(): Promise<number> {
    return new Promise((resolve, reject) => {
      childProcess.exec('free', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        const ramTotalMatchRes = stdout
          .match(/Mem:\s+\d+\s+(\d+)/)

        resolve((ramTotalMatchRes) ? Number(ramTotalMatchRes[1]) : -1);
      })
    })
  }

  async getCpuLoad(): Promise<number[]> {
    // TODO: add
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
          cpuNum: (cpuDoc) ? Number(cpuDoc.data) : -1,
          arch: (archDoc) ? archDoc.data as OsArch : 'unknown',
        });
      })
    })
  }

  private async getRamTotal(): Promise<number> {
    return new Promise((resolve, reject) => {
      childProcess.exec('free', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        const ramTotalMatchRes = stdout.match(/Mem:\s+(\d+)/)

        resolve((ramTotalMatchRes) ? Number(ramTotalMatchRes[1]) : -1);
      })
    })
  }

}
