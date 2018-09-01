mkdirPLogic = require('../../host/src/helpers/mkdirPLogic')


describe.only 'helpers.mkdirPLogic', ->
  it 'common usage', ->
    fullPath = '/path/to/dir'
    existentPath = '/path'
    isDirExists = (dirName) =>
      dirName == existentPath
    mkdir = sinon.spy()

    await mkdirPLogic(fullPath, isDirExists, mkdir)

    sinon.assert.calledTwice(mkdir)
    sinon.assert.calledWith(mkdir.getCall(0), '/path/to')
    sinon.assert.calledWith(mkdir.getCall(0), fullPath)
