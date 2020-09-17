readLogic = require('../../../../system/lib/remoteFunctionProtocol/readLogic')


describe.only 'entities.services.IoSetPortExpander.readLogic', ->
#  beforeEach ->
#  it 'parseResult - full message', ->
#    packagePayload = new Uint8Array([
#      # length of the first message
#      1,
#      # data of the first message,
#      5,
#      # length of the second message
#      2,
#      # data of the second message,
#      8,
#      9,
#      # marker of length of the next message
#      255,
#      # length of the next message
#      7,
#    ]);
#
#    assert.deepEqual(readLogic.parseResult(packagePayload), [
#      [
#        new Uint8Array([5]),
#        new Uint8Array([8, 9]),
#      ]
#      7,
#    ]);
#
#  it 'parseResult - no next message', ->
#    packagePayload = new Uint8Array([
#      # length of the first message
#      1,
#      # data of the first message,
#      5,
#    ]);
#
#    assert.deepEqual(readLogic.parseResult(packagePayload), [
#      [ new Uint8Array([5]) ]
#      0,
#    ]);
