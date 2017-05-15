"use strict"

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var path = require('path');
var Scope = require('./ast').Scope;
var Semantics = require('./semantics');

//load the grammar
var gram = ohm.grammar(fs.readFileSync(path.join(__dirname,'grammar.ohm')).toString());

var globalScope = new Scope();
globalScope.setSymbol("print",function(arg1){
    console.log("print:",arg1);
    return arg1;
});

var sem = Semantics.load(gram);
function test(input, answer) {
    var match = gram.match(input);
    if(match.failed()) return console.log("input failed to match " + input + match.message);
    var result = sem(match).toAST();
    //console.log('result = ', JSON.stringify(result,null,' '), answer);
    result = result.resolve(globalScope);
    //console.log('resolved = ', JSON.stringify(result,null,' '), answer);
    ///if(result.apply) result = result.apply(Objects.GlobalScope);
    if(result == null && answer == null) return console.log('success',input);
    assert(result.jsEquals(answer),true);
    console.log('success',input);
}

test('2*3+4', 2*3+4);
test('2*(2*2)',2*2*2);
test('(2*3)*4',(2*3)*4);
test('4+3*2', 4+3*2);
test('(4+3)*2',(4+3)*2);
test('4/5',4/5);
test('4-5',4-5);


test('10',10);
test('x::int', null);
test('x -> 10',10);
test('x',10);
test('x * 2',20);

test('{func fib(a::int)::int { if (a <= 2) { 1 } else { fib(a - 2) + fib(a - 1) } } fib(6) }', 8);
test('{func fib(x::int)::int { if (x <= 2) { 1 } else { a::int b::int a -> 1 b -> 1 for (i -> 3 to x) { b -> a + b a -> b - a } b } } fib(6) }', 8);

test('{a::bool b::bool a -> true b -> false a == b }', false);
test('{a::bool b::bool a -> true b -> true a == b }', true);