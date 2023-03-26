helpers = require('../../../../../../squidlet-networking/src/bridges/__old/Network/helpers')


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

  it 'encodeNetworkMessage', ->
    assert.deepEqual(helpers.encodeNetworkMessage(@message), @encodedMessage);

  it 'decodeNetworkMessage', ->
    assert.deepEqual(helpers.decodeNetworkMessage(@encodedMessage), @message);

  it 'circular', ->
    assert.deepEqual(
      helpers.decodeNetworkMessage(helpers.encodeNetworkMessage(@message)),
      @message
    );

  it 'encodeNetworkMessage errors', ->
    assert.throws(() => helpers.encodeNetworkMessage({@message..., TTL: '1'}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., TTL: 0}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., TTL: 256}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., messageId: 1}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., messageId: 'a'}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., uri: 1}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., uri: _.repeat('a', 256)}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., to: 1}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., to: _.repeat('a', 256)}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., completeRoute: {}}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., completeRoute: _.repeat('a', 256).split('')}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., completeRoute: ['a', _.repeat('a', 256)]}));
    assert.throws(() => helpers.encodeNetworkMessage({@message..., payload: [0]}));
