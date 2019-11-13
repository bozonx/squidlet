validateHostConfig = require('../../hostEnvBuilder/hostConfig/validateHostConfig').default

describe 'envBuilder.validateHostConfig', ->
  beforeEach ->
    @hostConfig = {
      platform: 'nodejs'
      machine: 'rpi'
    }

  it 'required - success', ->
    assert.isUndefined(validateHostConfig(@hostConfig))

  it 'whitelist - odd param', ->
    assert.isString(validateHostConfig({ @hostConfig..., odd: 'str' }))

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

  it 'definitions and services shortcuts', ->
    # success
    assert.isUndefined(validateHostConfig({ @hostConfig..., devices: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., drivers: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., services: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., ios: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., automation: {param: 1} }))
    #assert.isUndefined(validateHostConfig({ @hostConfig..., consoleLogger: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., mqtt: {param: 1} }))
    assert.isUndefined(validateHostConfig({ @hostConfig..., ioServer: {param: 1} }))
    # not object
    assert.isString(validateHostConfig({ @hostConfig..., devices: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., drivers: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., services: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., ios: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., automation: 'str' }))
    #assert.isString(validateHostConfig({ @hostConfig..., consoleLogger: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., mqtt: 'str' }))
    assert.isString(validateHostConfig({ @hostConfig..., ioServer: 'str' }))

  it 'devicesDefaults', ->
    # success
    assert.isUndefined(validateHostConfig({ @hostConfig..., devicesDefaults: {param: 1} }))
    # not object
    assert.isString(validateHostConfig({ @hostConfig..., devicesDefaults: 'str' }))

#  it 'buildConfig', ->
#    # success
#    assert.isUndefined(validateHostConfig({ @hostConfig..., buildConfig: {} }))
#    # not object
#    assert.isString(validateHostConfig({ @hostConfig..., buildConfig: 'str' }))
#    # success
#    assert.isUndefined(validateHostConfig({ @hostConfig..., buildConfig: {
#      devsModernDst: 'str'
#      devsLegacyDst: 'str'
#      devsMinDst: 'str'
#      devsSrc: 'str'
#    } }))
#    # incorrect types
#    assert.isString(validateHostConfig({ @hostConfig..., buildConfig: {devsModernDst: 5} }))
#    assert.isString(validateHostConfig({ @hostConfig..., buildConfig: {devsLegacyDst: 5} }))
#    assert.isString(validateHostConfig({ @hostConfig..., buildConfig: {devsMinDst: 5} }))
#    assert.isString(validateHostConfig({ @hostConfig..., buildConfig: {devsSrc: 5} }))

  it 'config', ->
    # success
    assert.isUndefined(validateHostConfig({ @hostConfig..., config: {} }))
    # not object
    assert.isString(validateHostConfig({ @hostConfig..., config: 'str' }))
    # success
    assert.isUndefined(validateHostConfig({ @hostConfig..., config: {
#      varDataDir: 'str'
#      envSetDir: 'str'
      #logLevel: 'debug'
      #defaultStatusRepublishIntervalMs: 5
      #defaultConfigRepublishIntervalMs: 5
      requestTimeoutSec: 5
      senderResendTimeout: 5
    } }))
    # incorrect types
    #assert.isString(validateHostConfig({ @hostConfig..., config: {varDataDir: 5} }))
    #assert.isString(validateHostConfig({ @hostConfig..., config: {envSetDir: 5} }))
    #assert.isString(validateHostConfig({ @hostConfig..., config: {logLevel: 'other'} }))
    #assert.isString(validateHostConfig({ @hostConfig..., config: {defaultStatusRepublishIntervalMs: 'str'} }))
    #assert.isString(validateHostConfig({ @hostConfig..., config: {defaultConfigRepublishIntervalMs: 'str'} }))
    assert.isString(validateHostConfig({ @hostConfig..., config: {requestTimeoutSec: 'str'} }))
    assert.isString(validateHostConfig({ @hostConfig..., config: {senderResendTimeout: 'str'} }))
