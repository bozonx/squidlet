DebounceCall = require('../../../host/helpers/DebounceCall').default;


describe 'helpers.DebounceCall', ->
  beforeEach ->
    @id = 'myId'
    @debounceCall = new DebounceCall()

  it "invoke", ->
    @debounceCall.invoke(@id)

