"use strict"
const readline = require('readline');

var ohm = require('ohm-js');
var fs = require('fs');
var assert = require('assert');
var Scope = require('./src/ast').Scope;
var Semantics = require('./src/semantics');

var gram = ohm.grammar(fs.readFileSync('./src/grammar.ohm').toString());
var globalScope = new Scope();
var sem = Semantics.load(gram);
globalScope.setSymbol("print",function(arg1){
    if (arg1 && arg1.val) {
        console.log(arg1.val);
    } else {
        console.log(arg1);
    }
    return null;
});
globalScope.setSymbol("printRaw",function(arg1){
    console.log(arg1);
    return null;
});

var args = process.argv.slice(2);
if (args.length != 1) {
    console.log("Quark! Use -v to launch live console or gib me file to eat!");
} else {
    if (args[0] == '-v') {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'Frog> '
        });

        rl.prompt();

        rl.on('line', (line) => {
            var match = gram.match(line.trim());
            if(match.failed())
                console.log("Quark! " + match.message);
            var result = sem(match).toAST();
            result = result.resolve(globalScope);
            if(result != null && result.val)
                console.log(result.val);
            rl.prompt();
        }).on('close', () => {
            console.log('*Frog flies away*');
            process.exit(0);
        });
    } else {
        if (new RegExp('\.frg$').test(args[0])) {
            var match = gram.match(fs.readFileSync(args[0]));
            if(match.failed())
                console.log("Quark! " + match.message);
            var result = sem(match).toAST();
            result = result.resolve(globalScope);
            if(result != null)
                console.log("*Frog flies away*");
        } else {
            console.log("Quark! This is not frog! Use .frg extension.");
        }
    }
}

