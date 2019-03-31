validate = require('../../hostEnvBuilder/hostConfig/validateManifests').default


describe.only 'envBuilder.validateManifests', ->
  beforeEach ->
    @manifest = {
      baseDir: 'str'
      name: 'str'
      main: './main.ts'
    }

  it 'device', ->

  it 'driver', ->

  it 'base params - success', ->
    assert.isUndefined(validate('service', {
      @manifest...
      system: true
      devices: ['MyDevice']
      drivers: ['MyDriver']
      services: ['MyService']
      devs: ['MyDev']
      files: ['./file.ts']
      props: { param: {type: 'number'} }
    }))

  it 'base params - required', ->
    assert.isString(validate('service', { @manifest..., baseDir: undefined }))
    assert.isString(validate('service', { @manifest..., name: undefined }))
    assert.isString(validate('service', { @manifest..., main: undefined }))

  it 'base params - types', ->
    assert.isString(validate('service', { @manifest..., baseDir: 5 }))
    assert.isString(validate('service', { @manifest..., name: 5 }))
    assert.isString(validate('service', { @manifest..., main: 5 }))
    assert.isString(validate('service', { @manifest..., system: 5 }))
    assert.isString(validate('service', { @manifest..., devices: 5 }))
    assert.isString(validate('service', { @manifest..., drivers: 5 }))
    assert.isString(validate('service', { @manifest..., services: 5 }))
    assert.isString(validate('service', { @manifest..., devs: 5 }))
    assert.isString(validate('service', { @manifest..., files: 5 }))
    assert.isString(validate('service', { @manifest..., props: 5 }))

  it 'base params - main local path', ->
    assert.isString(validate('service', { @manifest..., main: '/file' }))
    assert.isString(validate('service', { @manifest..., main: '../file' }))

  it 'base params - files local path', ->
    assert.isString(validate('service', { @manifest..., files: ['/file'] }))
    assert.isString(validate('service', { @manifest..., files: ['../file'] }))

  it 'base params - props', ->
    # required type
    assert.isString(validate('service', { @manifest..., props: {param: {}} }))
    # unknown type
    assert.isString(validate('service', { @manifest..., props: {param: { type: 'unknown' }} }))
    assert.isString(validate('service', { @manifest..., props: {param: { type: 'str'}} }))
    # required param
    assert.isString(validate('service', { @manifest..., props: {param: {
      type: 'number'
      required: 5
    }} }))
    # white list
    assert.isString(validate('service', { @manifest..., props: {param: {
      type: 'number'
      odd: 'str'
    }} }))

  it 'base params - props default', ->
    # default has to be the same type as a type param
    assert.isUndefined(validate('service', { @manifest..., props: {
      param: {
        type: 'number'
        default: 5
      }
    } }))
    assert.isString(validate('service', { @manifest..., props: {
      param: {
        type: 'number'
        default: 'str'
      }
    } }))
    # one of compund type
    assert.isUndefined(validate('service', { @manifest..., props: {
      param: {
        type: 'number | string'
        default: 5
      }
    } }))
    assert.isString(validate('service', { @manifest..., props: {
      param: {
        type: 'number | string'
        default: true
      }
    } }))
