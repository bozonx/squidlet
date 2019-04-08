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

  it 'yamlToJs', ->
    testYaml = '''
      emptyObj: {}
      arr: []
      empty:


      obj:
        param: 1
        emptyParam:

      objWillBeEmpty:
        param:
          emptyParam:

      emptyStr: ''
      null: null
      undefined: undefined
      string: 'str'
      num: 0
      empty2:
    ''';

    assert.deepEqual(helpers.yamlToJs(testYaml), {
      emptyObj: {}
      arr: []
      obj: {param: 1}
      #empty: undefined
      emptyStr: ''
      null: null
      undefined: 'undefined'
      string: 'str'
      num: 0
    });
