helpers = require('../../../system/lib/binaryHelpers')


describe 'system.lib.binaryHelpers', ->
  it 'isEqualUint8Array', ->
    assert.isTrue(helpers.isEqualUint8Array(new Uint8Array([]), new Uint8Array([])))
    assert.isTrue(helpers.isEqualUint8Array(new Uint8Array([1,2,3]), new Uint8Array([1,2,3])))
    assert.isFalse(helpers.isEqualUint8Array(new Uint8Array([1,2,3]), new Uint8Array([1,2])))
    assert.isFalse(helpers.isEqualUint8Array(new Uint8Array([]), undefined ))
    assert.isFalse(helpers.isEqualUint8Array(undefined, new Uint8Array([])))
    assert.isFalse(helpers.isEqualUint8Array([], []))

  it 'uint8ArrayKeys', ->
    arr = new Uint8Array([0,1,2,3,4])

    assert.deepEqual(helpers.uint8ArrayKeys(arr), [0,1,2,3,4])
    assert.deepEqual(helpers.uint8ArrayKeys(new Uint8Array([])), [])

  it 'withoutFirstItemUint8Arr', ->
    uint = new Uint8Array(2)
    uint[0] = 127
    uint[1] = 255
    resultUint = new Uint8Array(1)
    resultUint[0] = 255
    assert.deepEqual(helpers.withoutFirstItemUint8Arr(uint), resultUint)

  it 'addFirstItemUint8Arr', ->
    uint = new Uint8Array(1)
    uint[0] = 255
    resultUint = new Uint8Array(2)
    resultUint[0] = 127
    resultUint[1] = 255
    assert.deepEqual(helpers.addFirstItemUint8Arr(uint, 127), resultUint)

  it 'hexStringToUint8Arr', ->
    assert.deepEqual(helpers.hexStringToUint8Arr('ffff'), new Uint8Array([ 255, 255 ]))
    assert.deepEqual(helpers.hexStringToUint8Arr('0102'), new Uint8Array([ 1, 2 ]))

  it 'uint8ArrToHexString', ->
    assert.equal(helpers.uint8ArrToHexString(new Uint8Array([ 255, 255 ])), 'ffff')
    assert.equal(helpers.uint8ArrToHexString(new Uint8Array([ 1, 2 ])), '0102')

  it 'int16ToHexString', ->
    assert.equal(helpers.int16ToHexString(1), '01')
    assert.equal(helpers.int16ToHexString(0x01), '01')

  it 'hexStringToHexNum', ->
    assert.equal(helpers.int16ToHexString('01'), 1)

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

  it 'uint8ToNum', ->
    assert.deepEqual(helpers.uint8ToNum(new Uint8Array([ 255, 255 ])), 65535)
    assert.deepEqual(helpers.uint8ToNum(new Uint8Array([ 0, 1 ])), 1)
    assert.deepEqual(helpers.uint8ToNum(new Uint8Array([ 255, 255, 255, 255 ])), 4294967295)

  it 'int32ToHexString', ->
    assert.throws(() => helpers.int32ToHexString(99999999999))
    assert.throws(() => helpers.int32ToHexString(-1))
    assert.deepEqual(helpers.int32ToHexString(4294967295), 'ffffffff')
    assert.deepEqual(helpers.int32ToHexString(65535), '0000ffff')
    assert.deepEqual(helpers.int32ToHexString(0), '00000000')

  it 'int32ToUint8Arr', ->
    assert.deepEqual(helpers.int32ToUint8Arr(4294967295), new Uint8Array([255,255,255,255]))

  it 'bitsToBytes', ->
    assert.deepEqual(
      helpers.bitsToBytes([
        true,true,true,true,true,true,true,true,
        false,false,false,false,false,false,false,false
      ]),
      new Uint8Array([ 255, 0 ])
    )

  it 'bytesToBits', ->
    assert.deepEqual(
      helpers.bytesToBits(new Uint8Array([ 255, 0 ])),
      [
        true,true,true,true,true,true,true,true,
        false,false,false,false,false,false,false,false
      ]
    )

  it 'updateBitInByte', ->
    assert.equal(helpers.updateBitInByte(0b00000001, 2, true), 0b00000101)
    assert.equal(helpers.updateBitInByte(0b00000000, 5, true), 0b00100000)
    assert.equal(helpers.updateBitInByte(0b11111111, 4, false), 0b11101111)
    assert.throws(() => helpers.updateBitInByte(0b00000000, 8, true))

  it 'getBitFromByte', ->
    assert.equal(helpers.getBitFromByte(0b00000001, 0), true)
    assert.equal(helpers.getBitFromByte(0b11000101, 1), false)
    assert.equal(helpers.getBitFromByte(0b10000000, 7), true)
    assert.throws(() => helpers.getBitFromByte(0b00000000, 8))

  it 'getAsciiNumber', ->
    assert.equal(helpers.getAsciiNumber(1), 49)

  it 'concatUint8Arr', ->
    assert.deepEqual(
      helpers.concatUint8Arr(new Uint8Array([1]), new Uint8Array([2, 3]), new Uint8Array([4, 5 ,6])),
      new Uint8Array([1, 2, 3, 4, 5, 6])
    )

  it 'combine2numberToByte and extract2NumbersFromByte', ->
    assert.equal(helpers.combine2numberToByte(15,15), 255)
    assert.equal(helpers.combine2numberToByte(0,0), 0)
    assert.equal(helpers.combine2numberToByte(1,1), 17)
    assert.equal(helpers.combine2numberToByte(3,3), 51)
    assert.deepEqual(helpers.extract2NumbersFromByte(0), [0, 0])
    assert.deepEqual(helpers.extract2NumbersFromByte(255), [15, 15])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(1,2)), [1, 2])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(5,14)), [5, 14])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(0,12)), [0, 12])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(8,0)), [8, 0])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(9,1)), [9, 1])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(7,6)), [7, 6])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(4,3)), [4, 3])
    assert.deepEqual(helpers.extract2NumbersFromByte(helpers.combine2numberToByte(10,11)), [10, 11])

#  it 'isUint8Array', ->
#    uint = new Uint8Array(1)
#    assert.isTrue(helpers.isUint8Array(uint))
#    assert.isFalse(helpers.isUint8Array([]))

