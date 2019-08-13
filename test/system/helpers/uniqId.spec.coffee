uniqId = require('../../../system/lib/uniqId').default


describe.only 'system.helpers.uniqId', ->
  it 'make it', ->
    assert.isFalse(uniqId() == uniqId())
    assert.equal(uniqId().length, 8)
