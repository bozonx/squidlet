validateHostConfig = require('../../hostEnvBuilder/hostConfig/validateHostConfig').default

describe.only 'envBuilder.validateHostConfig', ->
  beforeEach ->
    @hostConfig = {
      platform: 'nodejs'
      machine: 'rpi'
    }

  it 'required - success', ->
    assert.isUndefined(validateHostConfig(@hostConfig))

  it 'platform', ->
    # required
    assert.isString(validateHostConfig({ machine: 'rpi' }))
    # one of
    assert.isString(validateHostConfig({ platform: 'str', machine: 'rpi' }))

  it 'machine', ->
    # required
    assert.isString(validateHostConfig({ platform: 'nodejs' }))
    # string
    assert.isString(validateHostConfig({ platform: 'nodejs', machine: 5 }))

  it 'plugins', ->
    # success
    assert.isUndefined(validateHostConfig({ @hostConfig..., plugins: ['str'] }))
    # not string
    assert.isString(validateHostConfig({ @hostConfig..., plugins: 'str' }))


  describe 'buildConfig', ->
    it 'buildConfig', ->
      hostConfig = {
        platform: 'nodejs'
        machine: 'rpi'
        buildConfig: 'str'
      }

      assert.isString(validateHostConfig(hostConfig))
