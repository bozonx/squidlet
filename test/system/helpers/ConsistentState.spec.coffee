ConsistentState = require('../../../system/helpers/ConsistentState').default;


describe 'system.helpers.ConsistentState', ->
  beforeEach ->
    @consistentState = new ConsistentState()

  it "init", ->
