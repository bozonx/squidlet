import {exec} from 'node:child_process'
import type {ExecException} from 'node:child_process'
import type SysInfoIoType from '../../types/io/SysInfoIoType.js'
import {OS_ARCH, OS_TYPE, RUNTIME_ENV} from '../../types/SysInfo.js'
import type {OsArch, OsType, RuntimeEnv, SysPermanentInfo} from '../../types/SysInfo.js'
import type {IoIndex} from '../../types/types.js'
import type {IoContext} from '../../system/context/IoContext.js'
import {IoBase} from '../../base/IoBase.js'


export const SysInfoIoIndex: IoIndex = (ctx: IoContext) => {
  return new SysInfoIo(ctx)
}

export class SysInfoIo extends IoBase implements SysInfoIoType {
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
    return [0]
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
    return {
      osName: 'Linux',
      osVersion: '5',
    }
  }

}
