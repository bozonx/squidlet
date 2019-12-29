helpers = require('../../shared/helpers/helpers')


describe 'shared.helpers', ->
  beforeEach ->
    @hostnameCtlResult = """
       Static hostname: ivan-laptop
             Icon name: computer-laptop
               Chassis: laptop
            Machine ID: a2b294175f2c42048160e63ed8a1e0e5
               Boot ID: 1aabb936f33f4f9c86a0c6f78d06a84d
      Operating System: Linux Mint 19.1
                Kernel: Linux 4.15.0-51-generic
          Architecture: x86-64
    """


  it 'appendArray', ->
    arr = [1]
    helpers.appendArray(arr, [2])
    assert.deepEqual(arr, [1,2])

  it 'updateArray', ->
    arr = [0,1,2]
    helpers.updateArray(arr, ['a', 'b'])
    assert.deepEqual(arr, ['a', 'b', 2])
    # overflow
    arr = [0]
    helpers.updateArray(arr, [1,2])
    assert.deepEqual(arr, [1,2])
    # skip empty
    arr = [0,1,2]
    arr2 = []
    arr2[2] = 5
    helpers.updateArray(arr, arr2)
    assert.deepEqual(arr, [0,1,5])

  it "getFileNameOfPath", ->
    assert.equal(helpers.getFileNameOfPath('/path/to/file.ts'), 'file')
    assert.equal(helpers.getFileNameOfPath('/path/to/file'), 'file')
    assert.equal(helpers.getFileNameOfPath('/path/to/file/'), 'file')
    assert.equal(helpers.getFileNameOfPath('./file'), 'file')
    assert.equal(helpers.getFileNameOfPath('file'), 'file')
    assert.throws(() => helpers.getFileNameOfPath(''))

  it "resolvePlatformDir and loadMachineConfigInPlatformDir", ->
    machineConfig = { ios: [] }
    os = {
      require: () => {default: machineConfig}
    }
    platformDir = helpers.resolvePlatformDir('nodejs')

    result = helpers.loadMachineConfigInPlatformDir(os, platformDir, 'x86')

    assert.equal(machineConfig, result)

  it "getOsMachine", ->
    cmdResult = {
      status: 0
      stdout: @hostnameCtlResult.split("\n")
    }
    os = {
      spawnCmd: () => Promise.resolve(cmdResult)
    }

    result = await helpers.getOsMachine(os);

    assert.equal(result, 'x86')

  it "parseHostNameCtlResult", ->
    assert.deepEqual(helpers.parseHostNameCtlResult(@hostnameCtlResult), {arch: 'x86-64', osName: 'Linux Mint 19.1'})

  it "resolveMachineByOsAndArch", ->
    assert.equal(helpers.resolveMachineByOsAndArch('Linux Mint 19.1', 'x86-64'), 'x86')
    assert.equal(helpers.resolveMachineByOsAndArch('Linux Mint 19.1', 'arm'), 'arm')
    assert.equal(helpers.resolveMachineByOsAndArch('Raspbian', 'arm'), 'rpi')
    assert.throws(() => helpers.resolveMachineByOsAndArch('Raspbian', 'unknown'))

#  it "makeListOfNamesFromPaths", ->
#    assert.deepEqual(
#      helpers.makeListOfNamesFromPaths(['/path/to/file1.ts', '/path/file2']),
#      ['file1', 'file2']
#    )

#  it "runCmd", ->
#    os = {
#      spawnCmd: sinon.stub().returns(Promise.resolve({status: 0}))
#    }
#
#    helpers.runCmd(os, 'cmd', 'cwd')
#
#    sinon.assert.calledOnce(os.spawnCmd)
#    sinon.assert.calledWith(os.spawnCmd, 'cmd', 'cwd')
