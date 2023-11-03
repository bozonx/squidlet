// import {FilesWrapper} from './FilesWrapper.js'
// import {System} from '../System.js'
// import {FilesVersioned} from './FilesVersioned.js'
//
//
// export class SharedFiles {
//   readonly accessToken: string
//
//   // user data versioned and shared between all the hosts
//   readonly userData
//
//   // some external file system, mount your external fs here
//   readonly external
//
//   private readonly system: System
//
//
//   constructor(system: System, accessToken: string) {
//     this.system = system
//     this.accessToken = accessToken
//
//     this.userData = new FilesVersioned(this.system, 'userData')
//     this.external = new FilesWrapper(this.system, 'external')
//   }
//
// }
