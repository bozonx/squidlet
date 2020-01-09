helpers = require('../../../../entities/services/Network/helpers')


describe 'entities.services.Network.helpers', ->
  beforeEach ->
    @message = {
      to: 'toHost'
      from: 'fromHost'
      messageType: 0
      payload: {
        type: 'callMethod'
        payload: {
          method: 'myMethod'
          args: [1, true, 'str', [1], {a: "1"}]
        }
      }
    }

  it 'serializeMessage and deserializeMessage', ->
    assert.deepEqual(helpers.deserializeMessage(helpers.serializeMessage(@message)), @message);

  it 'serializeMessage and deserializeMessage - no "to"', ->
    delete @message.to

    assert.deepEqual(helpers.deserializeMessage(helpers.serializeMessage(@message)), @message);

  it '"to" is too long', ->
    @message.to = '12345678901234567'
    assert.throws(() => helpers.serializeMessage(@message));

  it '"from" is too long', ->
    @message.from = '12345678901234567'
    assert.throws(() => helpers.serializeMessage(@message));
