ProdBuild = require('../../../nodejs/starter/ProdBuild').default
Os = require('../../../shared/Os').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    @props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmoDir'
      platform: 'nodejs'
      force: false
    }
    @prodBuild = new ProdBuild(new Os(), @props)

  it 'buildInitialSystem', ->
    @prodBuild.buildSystem = {
      build: sinon.stub().returns(Promise.resolve())
    }

    await @prodBuild.buildInitialSystem()

    sinon.assert.calledOnce(@prodBuild.buildSystem.build)
    sinon.assert.calledWith(@prodBuild.buildSystem.build, 'envSetDir/system', 'tmoDir/system')

  it 'buildIos', ->
    # TODO: !!

  it 'buildPackageJson', ->
    packageJson = '{version: "1.2.3"}'
    @prodBuild.generatePackageJson = () => Promise.resolve(packageJson)
    @prodBuild.os.writeFile = sinon.stub().returns(Promise.resolve())

    await @prodBuild.buildPackageJson()

    sinon.assert.calledOnce(@prodBuild.os.writeFile)
    sinon.assert.calledWith(@prodBuild.os.writeFile, 'workDir/package.json', packageJson)

  it 'generatePackageJson', ->
    #packageJson = { name: 'myName', version: '1.2.3' }
    #@prodBuild.os.getFileContent = () => Promise.resolve(packageJson)
    squidletVersion = '1.2.3'
    deps = { myDep: '1.2.3' }
    @prodBuild.requireSquidletPackageJson = () => { version: squidletVersion }

    result = await @prodBuild.generatePackageJson(deps)

    testResult = """
    {
      "name": "squidlet-host",
      "version": "#{squidletVersion}",
      "dependencies": #{JSON.stringify(deps)}
    }

    """

    assert.equal(result, testResult)
