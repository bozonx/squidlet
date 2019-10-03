strings = require('../../../system/lib/strings')


describe 'system.lib.strings', ->
  it 'trimStart', ->
    assert.equal(strings.trimCharStart('  a  '), 'a  ')
    assert.equal(strings.trimCharStart('--a--', '-'), 'a--')
    assert.equal(strings.trimCharStart('/envSet', '/'), 'envSet')
    assert.equal(strings.trimCharStart('envSet/', '/'), 'envSet/')

  it 'trimEnd', ->
    assert.equal(strings.trimCharEnd('  a  '), '  a')
    assert.equal(strings.trimCharEnd('--a--', '-'), '--a')
    assert.equal(strings.trimCharEnd('envSet/', '/'), 'envSet')
    assert.equal(strings.trimCharEnd('/envSet', '/'), '/envSet')

  it 'trim', ->
    assert.equal(strings.trimChar('  a  '), 'a')
    assert.equal(strings.trimChar('--a--', '-'), 'a')
    assert.equal(strings.trimChar('/envSet/', '/'), 'envSet')

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
