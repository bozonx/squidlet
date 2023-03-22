import {IoBase} from '../../system/Io/IoBase.js'


export class FilesIo extends IoBase {
  readonly name = 'FilesIo'

  async init(): Promise<void> {
    await super.init()
  }

  async destroy(): Promise<void> {
    await super.destroy()
  }
}
