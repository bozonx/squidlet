strings = require('../../../system/lib/strings')


describe 'system.lib.strings', ->
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

  it 'padStart', ->
    assert.equal(strings.padStart('11', 8, '0'), '00000011')
