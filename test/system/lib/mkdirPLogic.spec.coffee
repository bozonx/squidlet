mkdirPLogic = require('../../../system/lib/mkdirPLogic').default


# TODO: review


describe 'system.lib.mkdirPLogic', ->
  it 'common usage', ->
    fullPath = '/path/to/my/dir'
    existentPath = '/path'
    isDirExists = (dirName) =>
      dirName == existentPath
    mkdir = sinon.spy()

    result = await mkdirPLogic(fullPath, isDirExists, mkdir)

    assert.isTrue(result)
    sinon.assert.calledThrice(mkdir)
    sinon.assert.calledWith(mkdir.getCall(0), '/path/to')
    sinon.assert.calledWith(mkdir.getCall(1), '/path/to/my')
    sinon.assert.calledWith(mkdir.getCall(2), fullPath)

  it 'don\'t create if the last path is /', ->
    fullPath = '/path/to/my/dir'
    isDirExists = () => false
    mkdir = sinon.spy()

    result = await mkdirPLogic(fullPath, isDirExists, mkdir)

    assert.isFalse(result)
    sinon.assert.notCalled(mkdir)
