Messenger = require('../../src/app/Messenger').default


describe 'app.Router', ->
  beforeEach ->
    @app = {

    }

    @messenger = new Messenger(@app);

  it 'publish', ->
