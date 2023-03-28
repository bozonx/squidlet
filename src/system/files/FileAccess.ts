import {FilesWrapper} from './FilesWrapper.js'
import {System} from '../System.js'
import {FilesVersioned} from './FilesVersioned.js'


export class FileAccess {
  readonly accessToken: string

  // user data versioned and shared between all the hosts
  readonly userData
  // for temporary files
  readonly tmp
  // some external file system, mount your external fs here
  readonly external

  private readonly system: System


  constructor(system: System, accessToken: string) {
    this.system = system
    this.accessToken = accessToken

    this.userData = new FilesVersioned(this.system, accessToken, 'userData')
    this.tmp = new FilesWrapper(this.system, accessToken, 'tmp')
    this.external = new FilesWrapper(this.system, accessToken, 'external')
  }

}
