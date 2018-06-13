helpers = require('../../src/helpers/helpers')


describe 'helpers.helpers', ->
  it 'uint8ArrayToString and stringToUint8Array', ->
    str = 'my строка'
    encoded = helpers.stringToUint8Array(str)

    assert.deepEqual(encoded, new Uint8Array([ 109, 121, 32, 209, 129, 209, 130, 209, 128, 208, 190, 208, 186, 208, 176 ]))
    assert.equal(helpers.uint8ArrayToString(encoded), str)

  it 'hexToBytes', ->
    assert.deepEqual(helpers.hexToBytes('ffff'), new Uint8Array([ 255, 255 ]))

  it 'bytesToHex', ->
    assert.deepEqual(helpers.bytesToHex(new Uint8Array([ 255, 255 ])), 'ffff')
