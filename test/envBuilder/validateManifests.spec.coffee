validate = require('../../hostEnvBuilder/hostConfig/validateManifests').default


describe 'envBuilder.validateManifests', ->
  beforeEach ->
    @manifest = {
      #baseDir: 'str'
      name: 'str'
      main: './main.ts'
    }

  it 'device', ->
    # type
    assert.isUndefined(validate('device', { @manifest..., type: 'str' }))
    assert.isString(validate('device', { @manifest... }))
    assert.isString(validate('device', { @manifest..., type: 5 }))
    # status
    assert.isUndefined(validate('device', { @manifest..., status: {
      param: { type: 'number' }
    }, type: 'str' }))
    assert.isString(validate('device', { @manifest..., status: 5, type: 'str' }))
    assert.isString(validate('device', { @manifest..., status: {
      param: { type: 'unknown' }
    }, type: 'str' }))
    # config
    assert.isUndefined(validate('device', { @manifest..., config: {
      param: { type: 'string' }
    }, type: 'str' }))
    assert.isString(validate('device', { @manifest..., config: 5, type: 'str' }))
    assert.isString(validate('device', { @manifest..., config: {
      param: { type: 'unknown' }
    }, type: 'str' }))

  it 'base params - success', ->
    assert.isUndefined(validate('service', {
      @manifest...
      system: true
      devices: ['MyDevice']
      drivers: ['MyDriver']
      services: ['MyService']
      ios: ['MyIo']
      files: ['./file.ts']
      props: { param: {type: 'number'} }
    }))

  it 'base params - required', ->
    #assert.isString(validate('service', { @manifest..., baseDir: undefined }))
    assert.isString(validate('service', { @manifest..., name: undefined }))
    assert.isString(validate('service', { @manifest..., main: undefined }))

  it 'base params - types', ->
    #assert.isString(validate('service', { @manifest..., baseDir: 5 }))
    assert.isString(validate('service', { @manifest..., name: 5 }))
    assert.isString(validate('service', { @manifest..., main: 5 }))
    assert.isString(validate('service', { @manifest..., system: 5 }))
    assert.isString(validate('service', { @manifest..., devices: 5 }))
    assert.isString(validate('service', { @manifest..., drivers: 5 }))
    assert.isString(validate('service', { @manifest..., services: 5 }))
    assert.isString(validate('service', { @manifest..., ios: 5 }))
    assert.isString(validate('service', { @manifest..., files: 5 }))
    assert.isString(validate('service', { @manifest..., props: 5 }))

  it 'base params - main local path', ->
    assert.isString(validate('service', { @manifest..., main: '/file' }))
    assert.isString(validate('service', { @manifest..., main: '../file' }))

  it 'base params - files local path', ->
    assert.isString(validate('service', { @manifest..., files: ['/file'] }))
    assert.isString(validate('service', { @manifest..., files: ['../file'] }))
