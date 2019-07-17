Promised = require('../../../system/helpers/Promised').default;


describe.only 'system.helpers.Promised', ->
  beforeEach ->
    @promised = new Promised()

  it "resolve, check state", ->
    promise = @promised.promise

    @promised.resolve()

    assert.isFulfilled(promise)
    assert.isTrue(@promised.isResolved())
    assert.isFalse(@promised.isRejected())
    assert.isTrue(@promised.isFulfilled())
    assert.isFalse(@promised.isCanceled())

  it "reject, check state", ->
    @promised.reject(new Error('err'))

    assert.isRejected(@promised.promise)
    assert.isFalse(@promised.isResolved())
    assert.isTrue(@promised.isRejected())
    assert.isTrue(@promised.isFulfilled())
    assert.isFalse(@promised.isCanceled())

  it "cancel, check state", ->

  it "destroy", ->
