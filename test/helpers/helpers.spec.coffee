helpers = require('../../src/helpers/helpers')


describe 'helpers.helpers', ->
  it 'uint8ArrayToString and stringToUint8Array', ->
    str = 'my строка'
    encoded = helpers.stringToUint8Array(str)

    assert.deepEqual(encoded, new Uint8Array([ 109, 121, 32, 209, 129, 209, 130, 209, 128, 208, 190, 208, 186, 208, 176 ]))
    assert.equal(helpers.uint8ArrayToString(encoded), str)

  it 'hexToBytes', ->
    assert.deepEqual(helpers.hexToBytes('ffff'), new Uint8Array([ 255, 255 ]))
    assert.deepEqual(helpers.hexToBytes('0102'), new Uint8Array([ 1, 2 ]))

  it 'bytesToHexString', ->
    assert.equal(helpers.bytesToHexString(new Uint8Array([ 255, 255 ])), 'ffff')
    assert.equal(helpers.bytesToHexString(new Uint8Array([ 1, 2 ])), '0102')

  it 'hexNumToHexString', ->
    assert.equal(helpers.hexNumToHexString(1), '01')
    assert.equal(helpers.hexNumToHexString(0x01), '01')

  it 'hexStringToHexNum', ->
    assert.equal(helpers.hexNumToHexString('01'), 1)
