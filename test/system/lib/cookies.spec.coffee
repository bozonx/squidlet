strings = require('../../../system/lib/strings')


describe 'system.lib.strings', ->
  it 'parseCookie', ->
    assert.deepEqual(strings.parseCookie('param1=value1; param2=2; param3=true'), {
      param1: 'value1'
      param2: 2
      param3: true
    })

  it 'parseCookie', ->
    obj = {
      param1: 'value1'
      param2: 2
      param3: true
      param4: null
      param5: undefined
    }
    cookie = 'param1=value1; param2=2; param3=true; param4=null; param5=undefined'

    assert.deepEqual(strings.parseCookie(cookie), obj)

  it 'stringifyCookie', ->
    obj = {
      param1: 'value1'
      param2: 2
      param3: true
      param4: null
      param5: undefined
    }
    cookie = 'param1=value1; param2=2; param3=true; param4=null; param5=undefined'

    assert.deepEqual(strings.stringifyCookie(obj), cookie)
