// "use strict";

// //Testai

// var ohm = require('ohm-js');
// var fs = require('fs');
// var assert = require('assert');
// var Scope = require('./ast').Scope;
// var MSymbol = require('./ast').MSymbol;

// var grammar = ohm.grammar(fs.readFileSync('src/grammar.ohm').toString());
// var semantics = grammar.createSemantics();

// var ASTBuilder = require('./semantics').load(semantics);

// var GLOBAL = new Scope(null);
// function test(input, answer) {
//     var match = grammar.match(input);
//     if(match.failed()) return console.log("input failed to match " + input + match.message);
//     var ast = ASTBuilder(match).toAST();
//     var result = ast.resolve(GLOBAL);
//     console.log('result = ', result);
//     assert.deepEqual(result.jsEquals(answer),true);
//     console.log('success = ', result, answer);
// }

"use strict"
/**
 * Created by josh on 6/4/16.
 */

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
// test('(2*3)*4',(2*3)*4);
// test('4+3*2', 4+3*2);
// test('(4+3)*2',(4+3)*2);
test('4/5',4/5);
test('4-5',4-5);


test('10',10);
test('x -> 10',10);
test('x',10);
test('x * 2',20);

test('{func fib(a) { if(a<=2){ 1 }else{ fib(a-2) + fib(a-1) } } fib(6) }', 8);
test('{func fib(x) { if (x <= 2) { 1 } else { a -> 1 b -> 1 for (i -> 3 to x) { b -> a + b a -> b - a } b } } fib(6) }', 8);