objects = require('../../../system/lib/objects')


describe.only 'system.helpers.objects', ->
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
