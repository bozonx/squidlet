strings = require('../../../system/lib/strings')


describe 'system.lib.strings', ->
  it 'base64ToString', ->
    assert.equal(strings.base64ToString('str строка'), 'c3RyINGB0YLRgNC+0LrQsA==')

  it 'stringToBase64', ->
    assert.equal(strings.stringToBase64('c3RyINGB0YLRgNC+0LrQsA=='), 'str строка')

  it 'firstLetterToUpperCase', ->
    assert.equal(strings.firstLetterToUpperCase('str str'), 'Str str')
    assert.equal(strings.firstLetterToUpperCase('strStr'), 'StrStr')
    assert.equal(strings.firstLetterToUpperCase('5str'), '5str')

  it 'splitFirstElement', ->
    assert.deepEqual(strings.splitFirstElement('path/to/dest', '/'), [ 'path', 'to/dest' ])
    assert.deepEqual(strings.splitFirstElement('path', '/'), [ 'path', undefined ])

  it 'splitLastElement', ->
    assert.deepEqual(strings.splitLastElement('path/to/dest', '/'), [ 'dest', 'path/to' ])
    assert.deepEqual(strings.splitLastElement('path', '/'), [ 'path', undefined ])

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
