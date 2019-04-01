helpers = require('../../../host/helpers/binaryHelpers')


describe.only 'helpers.binaryHelpers', ->
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

  it 'byteToString', ->
    assert.equal(helpers.byteToString(4), '00000100')

  it 'byteToBinArr', ->
    assert.deepEqual(helpers.byteToBinArr(4), [false, false, false, false, false, true, false, false])

  it 'numToWord', ->
    assert.equal(helpers.numToWord(65535), 'ffff')
    assert.equal(helpers.numToWord(1), '0001')

  it 'numToUint8Word', ->
    assert.deepEqual(helpers.numToUint8Word(65535), new Uint8Array([ 255, 255 ]))
    assert.deepEqual(helpers.numToUint8Word(1), new Uint8Array([ 0, 1 ]))

  it 'uint8WordToNum', ->
    assert.deepEqual(helpers.uint8WordToNum(new Uint8Array([ 255, 255 ])), 65535)
    assert.deepEqual(helpers.uint8WordToNum(new Uint8Array([ 0, 1 ])), 1)

#  it 'convertBitsToBytes', ->
#    assert.deepEqual(
#      helpers.convertBitsToBytes([true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false]),
#      new Uint8Array([ 255, 255 ])
#    )
#
#  it 'convertBytesToBits', ->
#    assert.deepEqual(
#      helpers.convertBytesToBits(new Uint8Array([ 255, 255 ])),
#      [true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false]
#    )

  it 'updateBitInByte', ->
    assert.equal(helpers.updateBitInByte(0, 2 , true), 4)

  it 'getBitFromByte', ->
    assert.equal(helpers.getBitFromByte(5, 2), true)

  it 'getAsciiNumber', ->
    assert.equal(helpers.getAsciiNumber(1), 49)


#  it 'uint8ArrayToText and textToUint8Array', ->
#    str = 'my строка'
#    encoded = helpers.textToUint8Array(str)
#
#    assert.deepEqual(encoded, new Uint8Array([ 109, 121, 32, 209, 129, 209, 130, 209, 128, 208, 190, 208, 186, 208, 176 ]))
#    assert.equal(helpers.uint8ArrayToText(encoded), str)
