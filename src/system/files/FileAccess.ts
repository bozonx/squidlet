
// export const FileAccessFactory = (accessToken: string): FileAccess => {
//   return new FileAccess(accessToken)
// }


import {FilesWrapper} from './FilesWrapper.js'
import {System} from '../System.js'

export class FileAccess {
  readonly accessToken: string
  // only for configs
  readonly cfg

  private readonly system: System


  constructor(system: System, accessToken: string) {
    this.system = system
    this.accessToken = accessToken

    this.cfg = new FilesWrapper(this.system, accessToken, 'cfg')
  }


}
