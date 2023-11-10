import {classMethodsStub} from "../helpers/classMethodsStub.js"
import {startSystemHelper} from "../helpers/startSystemHelper.ts"


describe('integration/wsconnect', () => {
  it('simple send', () => {
    const fileIoStub1 = (ctx) => {
      return classMethodsStub((prop) => {
        if (prop === 'myName') return 'FilesIo'

        return function(...a) {
          if (prop === 'init') {
            return
          }
          else if (prop === 'stat') {
            // if (a[0].indexOf('/cfgLocal/system/ios/FilesIo.yml') === 0) {
            //   return
            // }
            // else if (a[0].indexOf('/cfgLocal/system/system.yml') === 0) {
            //   return
            // }
            // else if (a[0].indexOf('/cfgLocal/system/drivers/FilesDriver.yml') === 0) {
            //   return
            // }
            // else if (a[0].indexOf('/cfgLocal/system/services/SessionsService.yml') === 0) {
            //   return
            // }

            return
          }
          else if (prop === 'mkDirP') {
            return
          }
          else if (prop === 'writeFile') {
            return
          }

          console.log(222, prop, a)
        }
      })
    }
    const fileIoStub2 = (ctx) => {
      return classMethodsStub((prop) => {
        if (prop === 'myName') return 'FilesIo'

        return function(...a) {

          console.log(333, prop, a)
        }
      })
    }

    const sys1 = startSystemHelper([fileIoStub1], (system) => {
      // system.use((ctx) => {
      //   return fileIoStub
      // })
    })
    const sys2 = startSystemHelper([fileIoStub2], (system) => {
      // system.use((ctx) => {
      //   return fileIoStub
      // })
    })

    assert.equal(1, 2)
  })

})
