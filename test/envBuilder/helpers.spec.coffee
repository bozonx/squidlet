helpers = require('../../hostEnvBuilder/helpers')

describe.only 'envBuilder.helpers', ->
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

  it 'clearRelativePath', ->
    assert.equal(helpers.clearRelativePath('/abs'), '/abs')
    assert.equal(helpers.clearRelativePath('./rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel'), 'rel')
    assert.equal(helpers.clearRelativePath('../rel/../to'), 'rel/to')
