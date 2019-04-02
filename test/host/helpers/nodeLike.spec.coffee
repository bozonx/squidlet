nodeLike = require('../../../host/helpers/nodeLike');


describe.only 'helpers.nodeLike', ->
  it "pathJoin", ->
    assert.equal(nodeLike.pathJoin('/path/', '/to/', './dir'), '/path/to/./dir')

  it "pathJoin", ->
    assert.equal(nodeLike.pathJoin('/path/', '/to/', './dir'), '/path/to/./dir')
