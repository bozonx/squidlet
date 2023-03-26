helpers = require('../../../system/lib/helpers')


describe 'system.lib.helpers', ->
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
    assert.deepEqual(helpers.parseArgs(''), [])
    assert.deepEqual(helpers.parseArgs(5), [5])
    assert.deepEqual(helpers.parseArgs(true), [true])
    assert.deepEqual(helpers.parseArgs(false), [false])
    assert.deepEqual(helpers.parseArgs('false'), [false])
    assert.deepEqual(helpers.parseArgs(null), [null])
    assert.deepEqual(helpers.parseArgs('null'), [null])
    assert.deepEqual(helpers.parseArgs('5, "str", undefined, true'), [5, 'str', undefined, true])
    assert.deepEqual(helpers.parseArgs('[5, "str", undefined, true], 5'), [[5, "str", undefined, true], 5])
    assert.deepEqual(helpers.parseArgs('{a: 5, b: undefined, c: true}, 5'), [{a: 5, c: true}, 5])
    assert.deepEqual(helpers.parseArgs('{a: {b: "bb"}}'), [{a: {b: 'bb'}}])
    assert.deepEqual(helpers.parseArgs('"bedroom.light1","turn",1'), ['bedroom.light1', 'turn', 1])
    # simplified strings
    assert.deepEqual(
      helpers.parseArgs('1,param1,true, [5, "str"]'),
      [1, 'param1', true, [5, "str"]]
    )

#  it 'splitTopicId', ->
#    assert.deepEqual(helpers.splitTopicId('/', 'id/sub/deeper'), [ 'id', 'sub/deeper' ])

#  it 'makeEventName', ->
#    assert.equal(helpers.makeEventName('|', 'cat', 'topic', 'name', 'otherName'), 'cat|topic|name|otherName')
#    assert.equal(helpers.makeEventName('|', 'cat', undefined, 'name'), 'cat|*|name')
