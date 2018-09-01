mkdirPLogic = require('../../host/src/helpers/mkdirPLogic').default


describe.only 'helpers.mkdirPLogic', ->
  it 'common usage', ->
    fullPath = '/path/to/my/dir'
    existentPath = '/path'
    isDirExists = (dirName) =>
      dirName == existentPath
    mkdir = sinon.spy()

    await mkdirPLogic(fullPath, isDirExists, mkdir)

    sinon.assert.calledThrice(mkdir)
    sinon.assert.calledWith(mkdir.getCall(0), '/path/to')
    sinon.assert.calledWith(mkdir.getCall(1), '/path/to/my')
    sinon.assert.calledWith(mkdir.getCall(2), fullPath)

# TODO: test for путь не существует или доходит до главного слэша
