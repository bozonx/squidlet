cookies = require('../../../system/lib/cookies')


describe 'system.lib.cookies', ->
  it 'parseCookie', ->
    assert.deepEqual(cookies.parseCookie('param1=value1; param2=2; param3=true'), {
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

    assert.deepEqual(cookies.parseCookie(cookie), obj)

  it 'stringifyCookie', ->
    obj = {
      param1: 'value1'
      param2: 2
      param3: true
      param4: null
      param5: undefined
    }
    cookie = 'param1=value1; param2=2; param3=true; param4=null; param5=undefined'

    assert.deepEqual(cookies.stringifyCookie(obj), cookie)
