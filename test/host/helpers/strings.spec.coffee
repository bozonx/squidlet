strings = require('../../../system/helpers/strings')


describe 'helpers.strings', ->
  it 'base64ToString', ->
    assert.equal(strings.base64ToString('str строка'), 'c3RyINGB0YLRgNC+0LrQsA==')

  it 'stringTobase64', ->
    assert.equal(strings.stringTobase64('c3RyINGB0YLRgNC+0LrQsA=='), 'str строка')

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
