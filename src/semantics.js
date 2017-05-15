var AST = require('./ast');

function binop(op,a,b) { return new AST.BinaryOp(op, a.toAST(), b.toAST()); }

var operation = {
    int:   function (a)          { return new AST.MNumber(parseInt(this.sourceString, 10)); },
    bool:  function (a)          { return new AST.MBoolean(a.sourceString == "true"); },
    str:   function (a, text, b) { return new AST.MString(text.sourceString); },
    ident: function (a, b)       { return new AST.MSymbol(this.sourceString) },

    AddExp_plus: (a, _, b) => binop('add',a,b),
    AddExp_minus: (a, _, b) => binop('sub',a,b),
    MulExp_times: (a, _, b) => binop('mul',a,b),
    MulExp_divide: (a, _, b) => binop('div',a,b),
    PriExp_paren: (_, a, _1) => a.toAST(),
    PriExp_neg: (_, a) => new AST.InvertNumber(a.toAST()),

    LtExpr:  (a, _, b) => binop('lt', a,b),
    GtExpr:  (a, _, b) => binop('gt', a,b),
    LteExpr: (a, _, b) => binop('lte',a,b),
    GteExpr: (a, _, b) => binop('gte',a,b),
    EqExpr:  (a, _, b) => binop('eq', a,b),
    NeqExpr: (a, _, b) => binop('neq',a,b),

    DefVar:     (ident, _, type) => new AST.DefVar(ident.toAST(), type.sourceString),
    AssignExpr: (a, _, b)  => new AST.Assignment(a.toAST(), b.toAST()),

    ForExpr_to: function (_, _1, ident, _2, val, _3, target, _4, body) {
        return new AST.ForLoop(ident.toAST(), val.toAST(), 1, target.toAST(), body.toAST());
    },
    ForExpr_downto: function (_, _1, ident, _2, val, _3, target, _4, body) {
        return new AST.ForLoop(ident.toAST(), val.toAST(), -1, target.toAST(), body.toAST());
    },

    Block: (_, body, _1) => new AST.Block(body.toAST()),
    IfExpr: function (_, _1, cond, _2, tb, _3, eb) {
        var thenBody = tb.toAST();
        var elseBody = eb ? eb.toAST()[0] : null;
        return new AST.IfCond(cond.toAST(), thenBody, elseBody);
    },

    FunCall: (a,_1,b,_2) => new AST.FunctionCall(a.toAST(), b.toAST()),
    Arguments: (a) => a.asIteration().toAST(),
    Parameters: (a) => a.asIteration().toAST(),
    DefFun: (_1, ident, _2, args, _3, _4, type, block) => new AST.FunctionDef(ident.toAST(), args.toAST(), type.sourceString, block.toAST())
};
module.exports = {
    load: function (gram) {
        return gram.createSemantics().addOperation('toAST', operation);
    }
};
