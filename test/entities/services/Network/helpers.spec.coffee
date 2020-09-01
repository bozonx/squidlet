helpers = require('../../../../entities/services/Network/helpers')


describe 'entities.services.Network.helpers', ->
  beforeEach ->
    @message = {
      TTL: 10
      messageId: 'aaaaaaaa'
      uri: 'b'
      to: 'c'
      completeRoute: ['d', 'e']
      payload: new Uint8Array([0,1,2])
    }
    @encodedMessage = new Uint8Array([
      # TTL
      10,
      # messageId
      97, 97, 97, 97, 97, 97, 97, 97,
      # length of completeRoute array
      2,
      # uri
      1, 98,
      # to
      1, 99,
      # completeRoute
      1, 100, 1, 101,
      # payload
      0, 1, 2
    ])

  # TODO: проверить ошибки

  it.only 'encodeNetworkMessage', ->
    assert.deepEqual(helpers.encodeNetworkMessage(@message), @encodedMessage);

  it 'decodeNetworkMessage', ->
    assert.deepEqual(helpers.decodeNetworkMessage(@encodedMessage), @message);



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
