helpers = require('../../hostEnvBuilder/helpers')

describe 'envBuilder.helpers', ->
  it 'sortByIncludeInList', ->
    assert.deepEqual(
      helpers.sortByIncludeInList(['three', 'one', 'four', 'two'], ['one', 'two']),
      [
        ['one', 'two'],
        ['three', 'four'],
      ]
    )

  it 'checkDevsExistance', ->
    assert.doesNotThrow(() => helpers.checkDevsExistance(['one'], ['one']))
    assert.throws(() => helpers.checkDevsExistance(['one'], ['two']))
