objects = require('../../../system/lib/objects')


describe 'system.lib.objects', ->
  it 'omitObj', ->
    assert.deepEqual(objects.omitObj({a: 0, b: 1, c: 2}, 'a', 'b'), {c: 2})

  it 'pickObj', ->
    assert.deepEqual(objects.pickObj({a: 0, b: 1, c: 2}, 'b', 'c'), {b: 1, c: 2})

  it 'findObj', ->
    objCb = (item, index) => item == 1
    assert.equal(objects.findObj({a: 0, b: 1}, objCb), 1)
    assert.isUndefined(objects.findObj({a: 0, b: 2}, objCb))

  it 'isPlainObject', ->
    cl = () ->
    assert.isTrue(objects.isPlainObject({}))
    assert.isFalse(objects.isPlainObject(new cl()))
    assert.isFalse(objects.isPlainObject([]))
    assert.isFalse(objects.isPlainObject(''))
    assert.isFalse(objects.isPlainObject(undefined))
    assert.isFalse(objects.isPlainObject(null))
    assert.isFalse(objects.isPlainObject(0))

  it 'objGet', ->
    obj = {
      level1: {
        level2: {
          level3: 1
        }
      }
    }

    assert.equal(objects.objGet(obj, 'level1.level2.level3'), obj.level1.level2.level3)
    assert.deepEqual(objects.objGet(obj, 'level1.level2'), obj.level1.level2)
    assert.deepEqual(objects.objGet(obj, 'level1'), obj.level1)
    assert.isUndefined(objects.objGet(obj, 'level1.level2.unknown'))
    assert.equal(objects.objGet(obj, 'level1.level2.unknown', 'default'), 'default')

  it 'getKeyOfObject', ->
    assert.equal(objects.getKeyOfObject({a: 1, b: 2}, 2), 'b')
    assert.isUndefined(objects.getKeyOfObject({a: 1, b: 2}, 3))

  it 'getDifferentKeys', ->
    assert.deepEqual(objects.getDifferentKeys({a:1, b:1, c:1}, {a:1, b:2}), ['b'])
    assert.deepEqual(objects.getDifferentKeys(undefined, {a:1, b:2}), ['a', 'b'])
    assert.deepEqual(objects.getDifferentKeys({a:1, b:1, c:1}, undefined), [])

  it 'isExactlyObject', ->
    cl = () ->
    assert.isTrue(objects.isExactlyObject({}))
    assert.isTrue(objects.isExactlyObject(new cl()))
    assert.isFalse(objects.isExactlyObject([]))
    assert.isFalse(objects.isExactlyObject(''))
    assert.isFalse(objects.isExactlyObject(undefined))
    assert.isFalse(objects.isExactlyObject(null))
    assert.isFalse(objects.isExactlyObject(0))

  it 'clearObject', ->
    obj = {a:1}

    objects.clearObject(obj)

    assert.deepEqual(obj, {})

  it 'mergeDeepObjects', ->
    top = {top: 'top', nested: {nestedTop: 'top'}}
    bottom = {top: 'bottom', bottom: 'bottom', nested: {nestedTop: 'bottom', nestedBottom: 'bottom'}}
    result = {top: 'top', bottom: 'bottom', nested: {nestedTop: 'top', nestedBottom: 'bottom'}}
    assert.deepEqual(objects.mergeDeepObjects(top, bottom), result)
    # not mutated
    assert.deepEqual(top, {top: 'top', nested: {nestedTop: 'top'}})
    # set undefined obviously
    assert.deepEqual(
      objects.mergeDeepObjects({top: undefined}, {top: 'top', bottom: 'bottom'}),
      {top: undefined, bottom: 'bottom'}
    )
