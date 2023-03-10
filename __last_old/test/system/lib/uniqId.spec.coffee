uniqId = require('../../../system/lib/uniqId')


describe 'system.lib.uniqId', ->
  it 'makeUniqNumber', ->
    assert.isNumber(uniqId.makeUniqNumber())
    assert.isTrue(uniqId.makeUniqNumber() != uniqId.makeUniqNumber())
    assert.isTrue(uniqId.makeUniqNumber() >= Number.MIN_SAFE_INTEGER)
    assert.isTrue(uniqId.makeUniqNumber() <= Number.MAX_SAFE_INTEGER)

  it 'getRuntimeId', ->
    assert.equal(uniqId.getRuntimeId().length, 8)
    assert.equal(uniqId.getRuntimeId(), uniqId.getRuntimeId())

  it 'makeUniqId', ->
    assert.isFalse(uniqId.makeUniqId() == uniqId.makeUniqId())
    assert.equal(uniqId.makeUniqId().length, 8)
