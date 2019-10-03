httpBody = require('../../../system/lib/httpBody')


describe 'system.lib.httpBody', ->
  it 'parseBody', ->
    uintArr = new Uint8Array([0])

    assert.isUndefined(httpBody.parseBody(undefined, undefined))
    assert.equal(httpBody.parseBody('application/octet-stream', uintArr), uintArr)
    assert.equal(httpBody.parseBody('application/json', '5'), 5)
    assert.equal(httpBody.parseBody('application/json', 'true'), true)
    assert.deepEqual(httpBody.parseBody('application/json', '[1]'), [1])
    assert.deepEqual(httpBody.parseBody('application/json', '{"a":1}'), {a:1})
    assert.equal(httpBody.parseBody('application/json', '"str"'), 'str')
    assert.equal(httpBody.parseBody('text/plain', 'str'), 'str')
    assert.equal(httpBody.parseBody('application/javascript', 'str'), 'str')
    assert.equal(httpBody.parseBody('application/xml', 'str'), 'str')
    assert.equal(httpBody.parseBody('text/html', '<!doctype html><body></body>'), '<!doctype html><body></body>')
    assert.isTrue(httpBody.parseBody('unsupported', true))
    assert.isUndefined(httpBody.parseBody('unsupported', undefined))

    # errors
    assert.throws(() => httpBody.parseBody(undefined, ''))
    assert.throws(() => httpBody.parseBody('application/octet-stream', []))
    # incorrect json
    assert.throws(() => httpBody.parseBody('application/json', '{a:1}'))
    assert.throws(() => httpBody.parseBody('application/json', 'str'))
    assert.throws(() => httpBody.parseBody('application/json', undefined))
    assert.throws(() => httpBody.parseBody('text/plain', undefined))
    assert.throws(() => httpBody.parseBody('application/javascript', undefined))
    assert.throws(() => httpBody.parseBody('application/xml', undefined))
    assert.throws(() => httpBody.parseBody('text/html', undefined))
    assert.throws(() => httpBody.parseBody('text/html', 'str'))

  it 'prepareBody', ->
    uintArr = new Uint8Array([0])

    assert.isUndefined(httpBody.prepareBody(undefined, undefined))
    assert.equal(httpBody.prepareBody('application/octet-stream', uintArr), uintArr)
    assert.equal(httpBody.prepareBody('application/json', 5), '5')
    assert.equal(httpBody.prepareBody('application/json', true), 'true')
    assert.equal(httpBody.prepareBody('application/json', [1]), '[1]')
    assert.equal(httpBody.prepareBody('application/json', {a:1}), '{"a":1}')
    assert.equal(httpBody.prepareBody('application/json', 'str'), '"str"')
    assert.equal(httpBody.prepareBody('text/plain', 'str'), 'str')
    assert.equal(httpBody.prepareBody('application/javascript', 'str'), 'str')
    assert.equal(httpBody.prepareBody('text/html', '<!doctype html><body></body>'), '<!doctype html><body></body>')
    assert.isTrue(httpBody.prepareBody('unsupported', true))
    assert.isUndefined(httpBody.prepareBody('unsupported', undefined))

    # errors
    assert.throws(() => httpBody.prepareBody(undefined, ''))
    assert.throws(() => httpBody.prepareBody('application/octet-stream', []))
    assert.throws(() => httpBody.prepareBody('application/json', undefined))
    assert.throws(() => httpBody.prepareBody('text/plain', undefined))
    assert.throws(() => httpBody.prepareBody('application/javascript', undefined))
    assert.throws(() => httpBody.prepareBody('application/xml', undefined))
    assert.throws(() => httpBody.prepareBody('text/html', undefined))
    assert.throws(() => httpBody.prepareBody('text/html', 'str'))

  it 'resolveBodyType', ->
    uintArr = new Uint8Array([0])

    assert.isUndefined(httpBody.resolveBodyType(undefined))
    assert.equal(httpBody.resolveBodyType(uintArr), 'application/octet-stream')
    assert.equal(httpBody.resolveBodyType('<!doctype html><body></body>'), 'text/html')
    assert.equal(httpBody.resolveBodyType('str'), 'text/plain')
    assert.equal(httpBody.resolveBodyType(5), 'application/json')
    assert.equal(httpBody.resolveBodyType(true), 'application/json')
    assert.equal(httpBody.resolveBodyType([]), 'application/json')
    assert.equal(httpBody.resolveBodyType({}), 'application/json')
