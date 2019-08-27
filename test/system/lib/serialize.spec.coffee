serialize = require('../../../system/lib/serialize')


describe.only 'system.lib.serialize', ->
  it 'base64ToString', ->
    assert.equal(serialize.base64ToString('str строка'), 'c3RyINGB0YLRgNC+0LrQsA==')

  it 'stringToBase64', ->
    assert.equal(serialize.stringToBase64('c3RyINGB0YLRgNC+0LrQsA=='), 'str строка')

  it 'uint8ArrayToText and textToUint8Array', ->
    str = 'my строка'
    encoded = serialize.textToUint8Array(str)

    assert.equal(serialize.uint8ArrayToText(encoded), str)

  it 'serializeJson and deserializeJson', ->
    jsonLength = 88
    json = {
      param1: 1
      param2: {
        binData: new Uint8Array([1,2,3])
      }
      otherBin: new Uint8Array([4, 5])
    }
    serialized = serialize.serializeJson(json);

    # length of json
    assert.deepEqual(serialized.slice(0, 4), new Uint8Array([0, 0, 0, jsonLength]));
    # data part at the tail
    assert.deepEqual(serialized.slice(jsonLength + 4), new Uint8Array([1, 2, 3, 4, 5]));

    deserialized = serialize.deserializeJson(serialized);
    assert.deepEqual(deserialized, json)
    assert.isTrue(deserialized.param2.binData instanceof Uint8Array)
