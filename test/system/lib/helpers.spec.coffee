helpers = require('../../../system/lib/helpers')


describe.only 'system.lib.helpers', ->
  it 'convertToLevel', ->
    assert.isTrue(helpers.convertToLevel(true))
    assert.isTrue(helpers.convertToLevel(1))
    assert.isTrue(helpers.convertToLevel('high'))
    assert.isTrue(helpers.convertToLevel('true'))
    assert.isTrue(helpers.convertToLevel('1'))
    assert.isTrue(helpers.convertToLevel('ON'))
    assert.isTrue(helpers.convertToLevel('On'))
    assert.isTrue(helpers.convertToLevel('on'))
    assert.isFalse(helpers.convertToLevel(false))
    assert.isFalse(helpers.convertToLevel(0))
    assert.isFalse(helpers.convertToLevel(5))
    assert.isFalse(helpers.convertToLevel('low, off and other...'))

  it 'isDigitalInputInverted', ->
    assert.isFalse(helpers.isDigitalInputInverted(false, false, false))
    assert.isFalse(helpers.isDigitalInputInverted(false, true, false))
    # double invert
    assert.isFalse(helpers.isDigitalInputInverted(true, true, true))

    assert.isTrue(helpers.isDigitalInputInverted(true, false, false))
    assert.isTrue(helpers.isDigitalInputInverted(false, true, true))
    # don't use pullup
    assert.isTrue(helpers.isDigitalInputInverted(true, false, true))

  it 'invertIfNeed', ->
    assert.isTrue(helpers.invertIfNeed(true, false))
    assert.isTrue(helpers.invertIfNeed(false, true))
    assert.isFalse(helpers.invertIfNeed(false, false))
    assert.isFalse(helpers.invertIfNeed(true, true))

  it 'resolveEdge', ->
    assert.equal(helpers.resolveEdge(undefined), 'both')
    assert.equal(helpers.resolveEdge(undefined, true), 'both')
    assert.equal(helpers.resolveEdge('both'), 'both')
    assert.equal(helpers.resolveEdge('both', true), 'both')
    assert.equal(helpers.resolveEdge('rising', false), 'rising')
    assert.equal(helpers.resolveEdge('falling', false), 'falling')
    # invert
    assert.equal(helpers.resolveEdge('rising', true), 'falling')
    assert.equal(helpers.resolveEdge('falling', true), 'rising')

  it 'combineTopic', ->
    assert.equal(helpers.combineTopic('/', 'first', 'second', 'third'), 'first/second/third')
    assert.equal(helpers.combineTopic('/', 'first', undefined, 'third'), 'first/third')
    assert.equal(helpers.combineTopic('/', 'first', 'second', undefined), 'first/second')

#  it 'splitTopicId', ->
#    assert.deepEqual(helpers.splitTopicId('/', 'id/sub/deeper'), [ 'id', 'sub/deeper' ])

#  it 'makeEventName', ->
#    assert.equal(helpers.makeEventName('|', 'cat', 'topic', 'name', 'otherName'), 'cat|topic|name|otherName')
#    assert.equal(helpers.makeEventName('|', 'cat', undefined, 'name'), 'cat|*|name')
