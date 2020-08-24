helpers = require('../../../../entities/services/Network/helpers')


describe.only 'entities.services.Network.helpers', ->
  beforeEach ->
    @request = {
      to: 'a'
      from: 'b'
      sender: 'c'
      url: 'd'
      TTL: 10
      body: new Uint8Array([0,1,3])
    }
    @requestEncoded = new Uint8Array([
      1,
      97,
      1,
      98,
      1,
      99,
      1,
      100,
      10,
      0,
      1,
      2,
    ])

  it 'serializeMessage and deserializeMessage', ->
    assert.deepEqual(helpers.encodeNetworkRequest(@request), @requestEncoded);

#  it 'serializeMessage and deserializeMessage - no "to"', ->
#    delete @message.to
#
#    assert.deepEqual(helpers.deserializeMessage(helpers.serializeMessage(@message)), @message);
#
#  it '"to" is too long', ->
#    @message.to = '12345678901234567'
#    assert.throws(() => helpers.serializeMessage(@message));
#
#  it '"from" is too long', ->
#    @message.from = '12345678901234567'
#    assert.throws(() => helpers.serializeMessage(@message));
