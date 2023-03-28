import {FilesWrapper} from './FilesWrapper.js'
import {System} from '../System.js'
import {FilesVersioned} from './FilesVersioned.js'


export class FileAccess {
  readonly accessToken: string
  // only for configs
  readonly cfg
  // installed aps
  readonly apps
  // apps local data
  readonly appData
  // apps shared data between all the hosts. Versioned
  readonly appShared
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

    this.cfg = new FilesWrapper(this.system, accessToken, 'cfg')
    this.apps = new FilesWrapper(this.system, accessToken, 'apps')
    this.appData = new FilesWrapper(this.system, accessToken, 'appData')
    this.appShared = new FilesVersioned(this.system, accessToken, 'appShared')
    this.userData = new FilesVersioned(this.system, accessToken, 'userData')
    this.tmp = new FilesWrapper(this.system, accessToken, 'tmp')
    this.external = new FilesWrapper(this.system, accessToken, 'external')
  }

}
