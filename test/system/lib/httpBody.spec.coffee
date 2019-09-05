httpBody = require('../../../system/lib/httpBody')


describe.only 'system.lib.httpBody', ->
  it 'parseBody', ->
    uintArr = new Uint8Array([0])

    assert.isUndefined(httpBody.parseBody(undefined, undefined))
    assert.equal(httpBody.parseBody('application/octet-stream', uintArr), uintArr)
    assert.equal(httpBody.parseBody('application/json', '5'), 5)
    assert.equal(httpBody.parseBody('application/json', 'true'), true)
    assert.deepEqual(httpBody.parseBody('application/json', '[1]'), [1])
    assert.deepEqual(httpBody.parseBody('application/json', '{"a":1}'), {a:1})
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
