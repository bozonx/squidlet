helpers = require('../../../system/lib/helpers')


describe.only 'system.lib.helpers', ->
  it 'resolveLevel', ->
    assert.isTrue(helpers.resolveLevel(true))
    assert.isTrue(helpers.resolveLevel(1))
    assert.isTrue(helpers.resolveLevel('high'))
    assert.isTrue(helpers.resolveLevel('true'))
    assert.isTrue(helpers.resolveLevel('1'))
    assert.isTrue(helpers.resolveLevel('ON'))
    assert.isTrue(helpers.resolveLevel('On'))
    assert.isTrue(helpers.resolveLevel('on'))
    assert.isFalse(helpers.resolveLevel(false))
    assert.isFalse(helpers.resolveLevel(0))
    assert.isFalse(helpers.resolveLevel(5))
    assert.isFalse(helpers.resolveLevel('low, off and other...'))

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

  it 'calcAllowedLogLevels', ->
    assert.deepEqual(helpers.calcAllowedLogLevels('debug'), ['debug', 'info', 'warn', 'error'])
    assert.deepEqual(helpers.calcAllowedLogLevels('info'), ['info', 'warn', 'error'])
    assert.deepEqual(helpers.calcAllowedLogLevels('warn'), ['warn', 'error'])
    assert.deepEqual(helpers.calcAllowedLogLevels('error'), ['error'])

  it 'collectPropsDefaults', ->
    assert.deepEqual(helpers.collectPropsDefaults(undefined ), {})
    assert.deepEqual(helpers.collectPropsDefaults({
      param1: {
        default: 1
      }
      param2: {
        default: 2
      }
      param3: {}
    }), { param1: 1, param2: 2})

  it 'convertEntityTypeToPlural', ->
    assert.equal(helpers.convertEntityTypeToPlural('driver'), 'drivers')
    assert.equal(helpers.convertEntityTypeToPlural('service'), 'services')
    assert.equal(helpers.convertEntityTypeToPlural('device'), 'devices')

  it 'parseArgs', ->
    assert.deepEqual(helpers.parseArgs(), [])
    assert.deepEqual(helpers.parseArgs(5), [5])
    assert.deepEqual(helpers.parseArgs(true), [true])
    # TODO: test
    assert.deepEqual(helpers.parseArgs(null), [null])
    assert.deepEqual(helpers.parseArgs('null'), [null])
    assert.deepEqual(helpers.parseArgs('5, "str", undefined, true'), [5, 'str', undefined, true])
    assert.deepEqual(helpers.parseArgs('[5, "str", undefined, true], 5'), [[5, "str", undefined, true], 5])
#    assert.deepEqual(helpers.parseArgs('{a: 5, b: undefined, c: true}, 5'), [{a: 5, b: undefined, c: true}, 5])

#  it 'splitTopicId', ->
#    assert.deepEqual(helpers.splitTopicId('/', 'id/sub/deeper'), [ 'id', 'sub/deeper' ])

#  it 'makeEventName', ->
#    assert.equal(helpers.makeEventName('|', 'cat', 'topic', 'name', 'otherName'), 'cat|topic|name|otherName')
#    assert.equal(helpers.makeEventName('|', 'cat', undefined, 'name'), 'cat|*|name')
