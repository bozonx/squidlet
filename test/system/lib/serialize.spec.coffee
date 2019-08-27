helpers = require('../../../system/lib/serialize')


describe.only 'system.lib.serialize', ->
  it 'uint8ArrayToText and textToUint8Array', ->
    str = 'my строка'
    encoded = helpers.textToUint8Array(str)

    assert.equal(helpers.uint8ArrayToText(encoded), str)

  it 'serializeJson and deserializeJson', ->
    jsonLength = 88
    json = {
      param1: 1
      param2: {
        binData: new Uint8Array([1,2,3])
      }
      otherBin: new Uint8Array([4, 5])
    }
    serialized = helpers.serializeJson(json);

    # length of json
    assert.deepEqual(serialized.slice(0, 4), new Uint8Array([0, 0, 0, jsonLength]));
    # data part at the tail
    assert.deepEqual(serialized.slice(jsonLength + 4), new Uint8Array([1, 2, 3, 4, 5]));

    deserialized = helpers.deserializeJson(serialized);
    assert.deepEqual(deserialized, json)
    assert.isTrue(deserialized.param2.binData instanceof Uint8Array)
