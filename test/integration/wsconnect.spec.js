import {classMethodsStub} from "../helpers/classMethodsStub.js"
import {startSystemHelper} from "../helpers/startSystemHelper.ts"


describe('integration/wsconnect', () => {
  it('simple send', () => {
    const fileIoStub = (ctx) => {
      return classMethodsStub((prop) => {
        if (prop === 'myName') return 'FilesIo'

        return function(...a) {
          console.log(222, prop, a)
        }
      })
    }

    const sys1 = startSystemHelper([fileIoStub], (system) => {
      // system.use((ctx) => {
      //   return fileIoStub
      // })
    })

    assert.equal(1, 2)
  })

})
