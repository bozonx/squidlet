#ProdBuild = require('../../nodejs/starters/ProdBuild').default
#Os = require('../../shared/helpers/Os').default
#
#
#describe 'nodejs.ProdBuild', ->
#  beforeEach ->
#    @props = {
#      workDir: 'workDir'
#      envSetDir: 'envSetDir'
#      tmpDir: 'tmpDir'
#      platform: 'nodejs'
#      #force: false
#    }
#    @prodBuild = new ProdBuild(new Os(), @props)
#
#  it 'buildInitialSystem', ->
#    @prodBuild.buildSystem = {
#      build: sinon.stub().returns(Promise.resolve())
#    }
#
#    await @prodBuild.buildInitialSystem()
#
#    sinon.assert.calledOnce(@prodBuild.buildSystem.build)
#    sinon.assert.calledWith(@prodBuild.buildSystem.build, 'envSetDir/system', 'tmpDir/system')
#
#  it 'buildIos', ->
#    @prodBuild.doBuildIo = sinon.stub().returns(Promise.resolve())
#
#    await @prodBuild.buildIos()
#
#    sinon.assert.calledOnce(@prodBuild.doBuildIo)
#    sinon.assert.calledWith(@prodBuild.doBuildIo, 'envSetDir/ios', 'tmpDir/ios')
#
#  it 'buildPackageJson', ->
#    packageJson = '{version: "1.2.3"}'
#    @prodBuild.generatePackageJson = () => Promise.resolve(packageJson)
#    @prodBuild.os.writeFile = sinon.stub().returns(Promise.resolve())
#
#    await @prodBuild.buildPackageJson()
#
#    sinon.assert.calledOnce(@prodBuild.os.writeFile)
#    sinon.assert.calledWith(@prodBuild.os.writeFile, 'workDir/package.json', packageJson)
#
#  it 'generatePackageJson', ->
#    squidletVersion = '1.2.3'
#    deps = { myDep: '1.2.3' }
#    @prodBuild.os.require = () => { version: squidletVersion }
#
#    result = await @prodBuild.generatePackageJson(deps)
#
#    testResult = """
#    {
#      "name": "squidlet-host",
#      "version": "#{squidletVersion}",
#      "dependencies": #{JSON.stringify(deps)}
#    }
#
#    """
#
#    assert.equal(result, testResult)
