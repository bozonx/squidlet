IoSetLocal = require('../../../system/IoSetLocal').default;


describe 'system.entities.IoSetLocal', ->
  beforeEach ->
    @IoClass = class
      param: 'value'
      constructor()

    @ioSetIndex = {
      myIo: @IoClass
    }
    @system = {
      systemConfig: {
        rootDirs: { envSet: '/envSet' }
        envSetDirs: { ios: 'ios' }
      }
    }
    @ioSet = new IoSetLocal()
    @ioSet.requireIoSetIndex = sinon.stub().returns(@ioSetIndex)

  it "init and get", ->
    await @ioSet.init(@system)

    sinon.assert.calledWith(@ioSet.requireIoSetIndex, '/envSet/ios')
    assert.isTrue(@ioSet.getIo('myIo') instanceof @IoClass)
    assert.equal(@ioSet.getIo('myIo').param, 'value')

  it "getNames", ->
    await @ioSet.init(@system)

    assert.deepEqual(@ioSet.getNames(), ['myIo'])

  it "destroy", ->
    assert.deepEqual(@ioSet.ioCollection, {})

    await @ioSet.init(@system)
    await @ioSet.destroy()

    assert.isUndefined(@ioSet.ioCollection)
