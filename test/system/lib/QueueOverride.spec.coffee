QueueOverride = require('../../../system/lib/debounceCall/QueueOverride').default;


describe 'system.lib.QueueOverride', ->
  beforeEach ->
    @id = 'myId'
    @otherId = 'otherId'
    @debounce = 1000
    @cb1 = sinon.spy()
    @cb2 = sinon.spy()
    @queue = new QueueOverride()

  it "invoke with debounce", ->
