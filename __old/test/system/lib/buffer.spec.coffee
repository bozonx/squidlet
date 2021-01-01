buffer = require('../../../system/lib/buffer')


describe 'system.lib.buffer', ->
  it 'convertBufferToUint8Array', ->
    arr = [0,1,2]
    data = new Buffer(arr)

    assert.deepEqual(buffer.convertBufferToUint8Array(data), new Uint8Array(arr))
