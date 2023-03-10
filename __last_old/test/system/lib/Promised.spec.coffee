Promised = require('../../../system/lib/Promised').default;


describe 'system.lib.Promised', ->
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

  it "cancel, check state. The promise will never be fulfilled", ->
    @promised.cancel()
    @promised.resolve()

    assert.isFalse(@promised.isResolved())
    assert.isFalse(@promised.isRejected())
    assert.isFalse(@promised.isFulfilled())
    assert.isTrue(@promised.isCanceled())

  it "dont cancel after fulfilled promise", ->
    @promised.resolve()
    @promised.cancel()

    assert.isTrue(@promised.isResolved())
    assert.isFalse(@promised.isRejected())
    assert.isTrue(@promised.isFulfilled())
    assert.isFalse(@promised.isCanceled())

  it "destroy", ->
    @promised.destroy()

    assert.isUndefined(@promised.promise)
