"use strict";

class Atom {
    constructor(val) { this.val = val; }
    resolve(scope)   { return this; }
    jsEquals(jsval)  { return this.val == jsval; }
}
class MNumber extends Atom {}
class MBoolean extends Atom {}
class MString extends Atom {}
class MLambda extends Atom {}

class BinaryOp {
    constructor(op, A, B) {
        this.op = op;
        this.A = A;
        this.B = B;
    }
    resolve(scope) {
        var a = this.A.resolve(scope).val;
        var b = this.B.resolve(scope).val;
        if (a.constructor.name != b.constructor.name) {
            throw new Error('Quark! Type mismatch!');
        }
        if(this.op == 'sub') return new MNumber(a-b);
        if(this.op == 'add') return new MNumber(a+b);
        if(this.op == 'mul') return new MNumber(a*b);
        if(this.op == 'div') return new MNumber(a/b);
        if(this.op == 'lt')  return new MBoolean(a<b);
        if(this.op == 'gt')  return new MBoolean(a>b);
        if(this.op == 'lte') return new MBoolean(a<=b);
        if(this.op == 'gte') return new MBoolean(a>=b);
        if(this.op == 'eq')  return new MBoolean(a==b);
        if(this.op == 'neq') return new MBoolean(a!=b);
    }
}

class Block {
    constructor(block) {
        this.statements = block;
    }
    resolve(scope) {
        var vals = this.statements.map((expr) => expr.resolve(scope));
        return vals.pop();
    }
}

class IfCond {
    constructor(cond, thenBody, elseBody) {
        this.cond = cond;
        this.thenBody = thenBody;
        this.elseBody = elseBody;
    }
    resolve(scope) {
        var val = this.cond.resolve(scope);
        if (val.val == true) {
            return this.thenBody.resolve(scope);
        }
        if(this.elseBody) return this.elseBody.resolve(scope);
        return new MBoolean(false);
    }
}


class Scope {
    constructor(parent) {
        this.storage = {};
        this.parent = parent?parent:null;
    }
    makeSubScope() {   return new Scope(this)  }
    hasSymbol(name) {  return this.getSymbol(name) != null }
    setSymbol(name, obj) {  this.storage[name] = obj; return this.storage[name] }
    getSymbol(name) {
        if(this.storage[name]) return this.storage[name];
        if(this.parent) return this.parent.getSymbol(name);
        throw new Error("Quark! " + name + " is not defined.");
    }
}


class MSymbol {
    constructor(name) {
        this.name = name;
    }
    resolve(scope) {
        return scope.getSymbol(this.name);
    }
}

class DefVar {
    constructor(symbol, type) {
        this.symbol = symbol;
        this.type = type;
    }
    resolve(scope) {
        var val = null;
        switch(this.type) {
            case 'int':
                val = new MNumber(null);
                break;
            case 'string':
                val = new MString(null);
                break;
            case 'bool':
                val = new MBoolean(null);
                break;
            case 'lambda':
                val = new MLambda(null);
                break;
            default:
                throw new Error("Quark! What is '" + this.type + "'?");
        }
        scope.setSymbol(this.symbol.name, val);
        return null;
    }
}

class Assignment {
    constructor(sym, val) {
        this.symbol = sym;
        this.val = val;
    }
    resolve(scope) {
        var variable = scope.getSymbol(this.symbol.name);
        var value = this.val.resolve(scope);
        if (value.constructor.name != variable.constructor.name) {
            throw new Error("Quark! Type mismatch! Expected " + variable.constructor.name + " got " + value.constructor.name);
        }
        scope.setSymbol(this.symbol.name, value);
        return null;
    }
}

class FunctionCall {
    constructor(fun, args) {
        this.fun = fun;
        this.args = args;
    }
    resolve(scope) {
        var fun = scope.getSymbol(this.fun.name);
        if (fun.constructor && fun.constructor.name == "MLambda") {
            fun = fun.val;
        }
        var args = this.args.map((arg) => arg.resolve(scope));
        return fun.apply(null,args);
    }
}


class FunctionDef {
    constructor(sym, params, type, body) {
        this.sym = sym;
        this.params = params;
        this.type = type;
        this.body = body;
    }
    resolve(scope) {
        var body = this.body;
        var params = this.params;
        var type = this.type;
        return scope.setSymbol(this.sym.name,function() {
            var args = arguments;
            var scope2 = scope.makeSubScope();
            params.forEach((param,i) => {
                param.resolve(scope2);
                var a = new Assignment(param.symbol, args[i]);
                a.resolve(scope2);
            });
            var bodyVal = body.resolve(scope2);
            var typeMap = {
                "int": "MNumber",
                "string": "MString",
                "bool": "MBoolean",
                "lambda": "MLambda",
                "void": null
            };
            if (typeMap[type] != null && bodyVal.constructor.name != typeMap[type]) {
                throw new Error("Quark! Bad return type of function! Expected " + type + ".");
            }
            if (typeMap[type] == null) {
                return null;
            }
            return bodyVal;
        });
    }
}

class LambdaDef {
    constructor(params, type, body) {
        this.params = params;
        this.type = type;
        this.body = body;
    }
    resolve(scope) {
        var body = this.body;
        var params = this.params;
        var type = this.type;
        return new MLambda(function() {
            var args = arguments;
            var scope2 = scope.makeSubScope();
            params.forEach((param,i) => {
                param.resolve(scope2);
                var a = new Assignment(param.symbol, args[i]);
                a.resolve(scope2);
            });
            var bodyVal = body.resolve(scope2);
            var typeMap = {
                "int": "MNumber",
                "string": "MString",
                "bool": "MBoolean",
                "lambda": "MLambda",
                "void": null
            };
            if (typeMap[type] != null && bodyVal.constructor.name != typeMap[type]) {
                throw new Error("Quark! Bad return type of lambda function! Expected " + type + ".");
            }
            if (typeMap[type] == null) {
                return null;
            }
            return bodyVal;
        });
    }
}

class ForLoop {
    constructor(ident, val, step, target, body) {
        this.ident = ident;
        this.val = val;
        this.step = step;
        this.target = target;
        this.body = body;
    }
    resolve(scope) {
        for (var i = this.val.resolve(scope).val; i != this.target.resolve(scope).val + this.step; i = i + this.step) {
            scope.setSymbol(this.ident.name, new MNumber(i));
            var ret = this.body.resolve(scope);
        }
        return ret;
    }
}

class InvertNumber{
    constructor(val) {
        this.val = val;
    }
    resolve(scope) {
        return new MNumber(-1 * this.val.resolve(scope).val);
    }
}

module.exports = {
    MNumber: MNumber,
    MBoolean: MBoolean,
    MString: MString,
    MLambda: MLambda,
    BinaryOp: BinaryOp,
    MSymbol: MSymbol,
    Scope: Scope,
    Block: Block,
    IfCond: IfCond,
    Assignment: Assignment,
    FunctionCall: FunctionCall,
    FunctionDef: FunctionDef,
    LambdaDef: LambdaDef,
    ForLoop: ForLoop,
    InvertNumber: InvertNumber,
    DefVar: DefVar
};