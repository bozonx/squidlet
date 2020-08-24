helpers = require('../../../../entities/services/Network/helpers')


describe.only 'entities.services.Network.helpers', ->
  beforeEach ->
    @request = {
      TTL: 10
      uri: 'd'
      to: 'a'
      from: 'b'
      sender: 'c'
      body: new Uint8Array([0,1,2])
    }
    @requestEncoded = new Uint8Array([
      10,
      1,
      100,
      1,
      97,
      1,
      98,
      1,
      99,
      0,
      1,
      2,
    ])
    @response = {
      TTL: 10
      to: 'a'
      from: 'b'
      sender: 'c'
      body: new Uint8Array([0,1,2])
    }
    @responseEncoded = new Uint8Array([
      10,
      1,
      97,
      1,
      98,
      1,
      99,
      0,
      1,
      2,
    ])

  # TODO: проверить ошибки
  # TODO: проверить body = 0

  it 'encodeNetworkRequest', ->
    assert.deepEqual(helpers.encodeNetworkRequest(@request), @requestEncoded);

  it 'decodeNetworkResponse', ->
    assert.deepEqual(helpers.decodeNetworkResponse(@responseEncoded), @response);



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
