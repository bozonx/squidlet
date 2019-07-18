ProdBuild = require('../../../nodejs/starter/ProdBuild').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    @os = {
      #exists: () =>
      #writeFile
      #getFileContent
    }
    @props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmoDir'
      platform: 'nodejs'
      force: false
    }
    @prodBuild = new ProdBuild(@os, @props)

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
    # TODO: !!

  it 'generatePackageJson', ->
    # TODO: !!
