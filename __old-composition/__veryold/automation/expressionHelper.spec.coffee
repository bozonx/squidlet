runExpr = require('./expressionHelper').default


describe.only 'services.Automation.expressionHelper', ->
  it 'runExpr', ->
    assert.isTrue(await runExpr('func1(true)', {
      func1: (val) => val,
    }))
    assert.isTrue(await runExpr('!func1(false) && !func2(false)', {
      func1: (val) => val,
      func2: (val) => val,
    }))
    assert.isFalse(await runExpr('!func1(true) && !func2(true)', {
      func1: (val) => val,
      func2: (val) => val,
    }))
    assert.isFalse(await runExpr('!func1(false) && !func2(true)', {
      func1: (val) => val,
      func2: (val) => val,
    }))
