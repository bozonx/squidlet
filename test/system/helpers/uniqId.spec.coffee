uniqId = require('../../../system/lib/uniqId')


describe.only 'system.helpers.uniqId', ->
  it 'make it', ->
    assert.isFalse(uniqId.makeUniqId() == uniqId())
    assert.equal(uniqId.makeUniqId().length, 8)
