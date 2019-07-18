ProdBuild = require('../../../nodejs/starter/ProdBuild').default


describe.only 'nodejs.ProdBuild', ->
  beforeEach ->
    os = {
      #exists: () =>
      #writeFile
      #getFileContent
    }
    props = {
      workDir: 'workDir'
      envSetDir: 'envSetDir'
      tmpDir: 'tmoDir'
      platform: 'nodejs'
      force: false
    }
    prodBuild = new ProdBuild(os, props)

  it 'buildInitialSystem', ->
    # TODO: !!

  it 'buildIos', ->
    # TODO: !!

  it 'buildPackageJson', ->
    # TODO: !!

  it 'generatePackageJson', ->
    # TODO: !!
