helpers = require('../../shared/helpers')


describe.only 'shared.helpers', ->
  beforeEach ->


  it "getFileNameOfPath", ->
    assert.equal(helpers.getFileNameOfPath('/path/to/file.ts'), 'file')
    assert.equal(helpers.getFileNameOfPath('/path/to/file'), 'file')
    assert.equal(helpers.getFileNameOfPath('/path/to/file/'), 'file')
    assert.equal(helpers.getFileNameOfPath('./file'), 'file')
    assert.equal(helpers.getFileNameOfPath('file'), 'file')
    assert.throws(() => helpers.getFileNameOfPath(''))

  it "resolvePlatformDir and loadMachineConfigInPlatformDir", ->
    platformDir = helpers.resolvePlatformDir('nodejs')

    machineConfig = helpers.loadMachineConfigInPlatformDir(platformDir, 'x86')

    assert.isArray(machineConfig.ios)

  it "parseHostNameCtlResult", ->
    hostnameCtlResult = """
       Static hostname: ivan-laptop
             Icon name: computer-laptop
               Chassis: laptop
            Machine ID: a2b294175f2c42048160e63ed8a1e0e5
               Boot ID: 1aabb936f33f4f9c86a0c6f78d06a84d
      Operating System: Linux Mint 19.1
                Kernel: Linux 4.15.0-51-generic
          Architecture: x86-64
    """

    assert.deepEqual(helpers.parseHostNameCtlResult(hostnameCtlResult), {arch: 'x86-64', osName: 'Linux Mint 19.1'})

  it "resolveMachineByOsAndArch", ->
    assert.equal(helpers.resolveMachineByOsAndArch('Linux Mint 19.1', 'x86-64'), 'x86')
    assert.equal(helpers.resolveMachineByOsAndArch('Linux Mint 19.1', 'arm'), 'arm')
    assert.equal(helpers.resolveMachineByOsAndArch('Raspbian', 'arm'), 'rpi')
    assert.throws(() => helpers.resolveMachineByOsAndArch('Raspbian', 'unknown'))
