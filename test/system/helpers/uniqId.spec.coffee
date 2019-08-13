uniqId = require('../../../system/lib/uniqId').default


describe 'system.helpers.uniqId', ->
  it 'make it', ->
    assert.isFalse(uniqId() == uniqId())
    assert.equal(uniqId().length, 8)
