Events = require('../../src/app/Events').default


describe 'app.Events', ->
  beforeEach ->
    @drivers = new Events()

  it 'listen and emit', ->
