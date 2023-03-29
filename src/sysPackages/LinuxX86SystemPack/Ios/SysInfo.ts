import {exec, ExecException} from 'node:child_process';
import SysInfoIo from '../../../types/io/SysInfoIo.js'
import {OS_ARCH, OS_TYPE, OsArch, OsType, RUNTIME_ENV, RuntimeEnv, SysPermanentInfo} from '../../../types/SysInfo.js'


export default class SysInfo implements SysInfoIo {
  async getInfo(): Promise<SysPermanentInfo> {
    const {cpuNum, arch} = await this.getCpuInfo()
    const ramTotalMb = await this.getRamTotal()
    const {osName, osVersion} = await this.getOsInfo()

    // TODO: cache result

    return {
      os: {
        type: OS_TYPE.linux as OsType,
        name: osName,
        version: osVersion,
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
      exec('free', (error: ExecException | null, stdout: string, stderr: string) => {
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
      exec('lscpu -J', (error: ExecException | null, stdout: string, stderr: string) => {
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
      exec('free', (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) return reject(error)

        const ramTotalMatchRes = stdout.match(/Mem:\s+(\d+)/)

        resolve((ramTotalMatchRes) ? Number(ramTotalMatchRes[1]) : -1);
      })
    })
  }

  private async getOsInfo(): Promise<{osName: string, osVersion: string}> {
    // return new Promise((resolve, reject) => {
    //   exec('uname -a', (error: ExecException | null, stdout: string, stderr: string) => {
    //     if (error) return reject(error)
    //
    //     const ramTotalMatchRes = stdout.match(/Mem:\s+(\d+)/)
    //
    //     resolve((ramTotalMatchRes) ? Number(ramTotalMatchRes[1]) : -1);
    //   })
    // })
  }

}
