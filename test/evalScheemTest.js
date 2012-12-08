if (typeof module !== 'undefined') {
    // In Node.js load required modules
    var assert = require('chai').assert;
    var expect = require('chai').expect;
    var PEG = require('pegjs');
    var fs = require('fs');
    var evalScheem = require('../scheem').evalScheem;
    var SCHEEM = PEG.buildParser(fs.readFileSync(
        'my.peg', 'utf-8'));
    var evalScheemString = function(expr, env) {
        return evalScheem(SCHEEM.parse(expr), env);
    }
} else {
    // In browser assume already loaded by <script> tags
    var assert = chai.assert,
        expect = chai.expect;
        console.log
}

suite('quote', function() {
    test('a number', function() {
        assert.deepEqual(
            evalScheem(['quote', 3], {}),
            3
        );
    });
    test('an atom', function() {
        assert.deepEqual(
            evalScheem(['quote', 'dog'], {}),
            'dog'
        );
    });
    test('a list', function() {
        assert.deepEqual(
            evalScheem(['quote', [1, 2, 3]], {}),
            [1, 2, 3]
        );
    });
});

suite('variables', function() {
    var env = { bindings: {
                    x:2, y:3, z:10
                },
                outer: {}
                };
    var tmp = evalScheem(['define', 'a', 5], env);
    test('eval of define test', function() {
        assert.strictEqual(
            evalScheem(['define', 'a', 5], env),
            0
        );
    });
    test('define var', function() {
        assert.deepEqual(
            env, { bindings: {
                    x:2, y:3, z:10, a:5
                },
                outer: {}
                }
        );
    });
    test('set var', function() {
        var tmp = evalScheem(['set!', 'a', 1], env);
        assert.deepEqual(
            env, { bindings: {
                    x:2, y:3, z:10, a: 1
                },
                outer: {}
                }
        );
    });
    test('update', function() {
        var env2 = { bindings: {'y': 16}, outer:
            { bindings: {'x': 19}, outer: { } }};
        var env2u = { bindings: {'y': 10}, outer:
            { bindings: {'x': 19}, outer: { } }};
        var tmp = evalScheem(['set!', 'a', 1], env);
        assert.deepEqual(
            update(env2, 'y', 10),
            env2u
        );
    });
    test('let', function() {
        var tmp = evalScheemString('(let ((x 2) (y 5)) (- y x))', env);
        assert.deepEqual(
            env, { bindings: {x: 2, y: 5}, outer: {bindings: {
                    x:2, y:3, z:10, a:1
                },
                outer: {}
                }}
        );
        assert.strictEqual(
            tmp, 3
        );
    });
});

suite('begin', function() {
    test('begin 1', function() {
        assert.strictEqual(
            evalScheem(['begin', 1, 2, 3], {}), 3
        );
    });
    test('begin 2', function() {
        assert.deepEqual(
            evalScheem(['begin', ['set!', 'x', 5], 
        ['set!', 'x', ['+', 'y', 'x']], 'x'], {bindings: {x:1, y:2}, outer: {}}), 7
        );
    });
});

suite('operators', function() {
    test('=', function() {
        assert.strictEqual(
            evalScheem(['=', 2, 3], {}), '#f'
        );
    });
    test('<', function() {
        assert.deepEqual(
            evalScheem(['<', ['+', 1, 1], ['+', 2, 3]], {}), '#t'
        );
    });
    test('>', function() {
        assert.deepEqual(
            evalScheem(['>', ['+', 1, 1], ['+', 2, 3]], {}), '#f'
        );
    });
    test('cons', function() {
        assert.deepEqual(
            evalScheem(['cons', ['quote', [1, 2]], ['quote', 
        [3, 4]]], {}), [[1, 2], 3, 4]
        );
    });
    test('car', function() {
        assert.deepEqual(
            evalScheem(['car', ['quote', [[1, 2], 3, 4]]], {}),
    [1, 2]
        );
    });
    test('cdr', function() {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [[1, 2], 3, 4]]], {}),
    [3, 4]
        );
    });
});

suite('if', function() {
    test('if 1', function() {
        assert.strictEqual(
            evalScheem(['if', ['=', 1, 0], 2, 3], {}), 3
        );
    });
    test('if 2', function() {
        assert.strictEqual(
            evalScheem(['if', ['=', 1, 1],
        ['if', ['=', 2, 3], 10, 11], 12], {}), 11
        );
    });
});

suite('errors', function() {
    test('Check set!', function() {
        var env = {x:2, y:3, z:10};
        expect(function () {
            evalScheem(['set!', 'a', 1], env);
        }).to.throw();
    });
    test('Check quote', function() {
        expect(function () {
            evalScheem(['quote', 'a', 1], {});
        }).to.throw();
    });
    test('Check second argument is provided to cons', function() {
        expect(function () {
            evalScheem(['cons', 'a'], {});
        }).to.throw();
    });
    test('Check second argument to cons is a list', function() {
        expect(function () {
            evalScheem(['cons', 'a', 'b'], {});
        }).to.throw();
    });
    test('Check argument to car is a list', function() {
        expect(function () {
            evalScheem(['car', 'a'], {});
        }).to.throw();
    });
    test('Check only one argument is provided to car', function() {
        expect(function () {
            evalScheem(['car', ['quote', 'a', '3'], 'b'], {});
        }).to.throw();
    });
    test('Check argument to cdr is a list', function() {
        expect(function () {
            evalScheem(['cdr', 'a'], {});
        }).to.throw();
    });
    test('Check only one argument is provided to cdr', function() {
        expect(function () {
            evalScheem(['cdr', ['quote', 'a', '3'], 'b'], {});
        }).to.throw();
    });
    test('Check variable names in let are strings', function() {
        expect(function () {
            evalScheemString('(let ((2 2) (x 5)) (* 2 5))', {});
        }).to.throw();
    });
    test('Check there is an expression to be evaluated in let', function() {
        expect(function () {
            evalScheemString('(let ((2 2) (x 5))', {});
        }).to.throw();
    });
    test('Check only one argument is provided to alert', function() {
        expect(function () {
            evalScheemString("(alert 'hello-world 2)", {});
        }).to.throw();
    });
    test('Check only lists are being used for the append method', function() {
        expect(function () {
            evalScheemString("(append 'hello-world 2)", {});
        }).to.throw();
    });
});

suite('parse', function() {
    test('a number', function() {
        assert.deepEqual(
            SCHEEM.parse('42'),
            42
        );
    });
    test('a variable', function() {
        assert.deepEqual(
            SCHEEM.parse('x'),
            'x'
        );
    });
    test('ordinary test', function() {
        assert.deepEqual(
            SCHEEM.parse("(* n (factorial (- n 1)))"),
            ["*", "n", ["factorial", ["-", "n", 1]]]
        );
    });
    test('ordinary test 2', function() {
        assert.deepEqual(
            SCHEEM.parse("(+ 1 (* x 3))"), 
            ["+", 1, ["*", "x", 3]]
        );
    });
    test('no whitespace', function() {
        assert.deepEqual(
            SCHEEM.parse("(2*(3+4))"), 
            [2, "*", [3, "+", 4]]
        );
    });
    test('numbers greater than 9', function() {
        assert.deepEqual(
            SCHEEM.parse("(12*(3+40))"), 
            [12, "*", [3, "+", 40]]
        );
    });
    test('allow any number of spaces between atoms', function() {
        assert.deepEqual(
            SCHEEM.parse("(*     n      (factorial (-    n    1)))"),
            ["*", "n", ["factorial", ["-", "n", 1]]]
        );
    });
    test('allow spaces around parentheses', function() {
        assert.deepEqual(
            SCHEEM.parse("          (* n (factorial (- n 1)))            "),
             ["*", "n", ["factorial", ["-", "n", 1]]]
        );
    });
    test('allow tabs', function() {
        assert.deepEqual(
            SCHEEM.parse("(* n          (factorial (- n 1)))"),
            ["*", "n", ["factorial", ["-", "n", 1]]]
        );
    });
    test('allow quotes', function() {
        assert.deepEqual(
            SCHEEM.parse("'(1 2 3)"), 
            ["quote", [1, 2, 3]]
        );
    });
    test('allow comments', function() {
        assert.deepEqual(
            SCHEEM.parse(";;(1 + 2 + 3)"),
            ""
        );
    });
});

suite('evalScheemString', function() {
    test('addition', function() {
        assert.strictEqual(
            evalScheemString("(+ 3 4 10 (+ 7 20))", {}),
            44
        );
    });

    test('multiplication', function() {
        assert.strictEqual(
            evalScheemString("(* 3 4 (* 7 10))", {}),
            840
        );
    });
    test('division', function() {
        assert.strictEqual(
            evalScheemString("(/ 36 2 3 (/ 6 2))", {}),
            2
        );
    });
    test('subtraction', function() {
        assert.strictEqual(
            evalScheemString("(- 36 2 3 (- 6 2))", {}),
            27
        );
    });
    test('mixed maths', function() {
        assert.strictEqual(
            evalScheemString("(/ (* 4 5 21) (+ 11 3) (- (+ 1 1) 4))", {}),
            -15
        );
    });
    test('if', function() {
        assert.strictEqual(
            evalScheemString("(if (= 2 3) 10 11)", {}),
            11
        );
    });
    test('<', function() {
        assert.strictEqual(
            evalScheemString("(if (< (+ 1 1) (* 3 3)) 6 12)", {}),
            6
        );
    });
    test('using variables', function() {
        assert.strictEqual(
            evalScheemString("(begin (define a 12) (define b (* a 2)) (set! a 8) (/ b a))", {}),
            3
        );
    });
});

suite('regular functions', function() {
    var always3 = function (x) { return 3; };
    var identity = function (x) { return x; };
    var plusone = function (x) { return x + 1; };
    var multiply_two = function(x, y) { return x * y; };
    var add_three = function(x, y, z) { return x + y + z; };
    var mixed_maths = function(x, y, z, a, b) { return x + (y * (z / a)) - b; };
    var env = {
        bindings: {'always3': always3,
               'identity': identity,
               'plusone': plusone,
               'multiply_two': multiply_two,
               'add_three': add_three,
                'mixed_maths': mixed_maths}, outer: { }};
    test('always3', function() {
        assert.strictEqual(
            evalScheemString("(always3 5)", env),
            3
        );
    });
    test('identity', function() {
        assert.strictEqual(
            evalScheemString("(identity 5)", env),
            5
        );
    });
    test('plusone', function() {
        assert.strictEqual(
            evalScheemString("(plusone 5)", env),
            6
        );
    });
    test('multiply_two (two args)', function() {
        assert.strictEqual(
            evalScheemString("(multiply_two 10 11)", env),
            110
        );
    });
    test('add_three (three args)', function() {
        assert.strictEqual(
            evalScheemString("(add_three 6 8 10)", env),
            24
        );
    });
    test('mixed_maths (five args)', function() {
        assert.strictEqual(
            evalScheemString("(begin (define j 5) (mixed_maths 100 50 (+ j 5) (- 3 1) 6))", env),
            344
        );
    });
    test('lambda one', function() {
        var env = {};
        assert.strictEqual(
            evalScheemString("(((lambda-one x (lambda-one y (+ x y))) 5) 3)", env),
            8
        );
    });
    test('lambda', function() {
        var env = {};
        assert.strictEqual(
            evalScheemString("((lambda (x y z) (+ x (* y 2) (- z 5))) 10 5 8)", env),
            23
        );
    });
    test('define and call function', function() {
        var env = {};
        assert.strictEqual(
            evalScheemString("(begin (define multi_maths (lambda (x y z) (+ x (* y 2) (- z 5)))) (define more_maths (lambda (x y) (* y (/ x 3)))))", env),
            0
        );
        assert.strictEqual(
            evalScheemString("(multi_maths 10 5 8)", env),
            23
        );
        assert.strictEqual(
            evalScheemString("(more_maths 8 12)", env),
            32
        );
    });
});
suite('anonymous functions and functions as values', function() {
    var env = {bindings: {'more_maths': function(x, y) { return y * (x / 3); }}, outer: {}};
    test('call anonymous function', function() {
        assert.strictEqual(
            evalScheemString("((lambda () (* 5 6)))", env),
            30
        );
    });
    test('pass a function as a value to another function', function() {
        assert.strictEqual(
            evalScheemString("(define multi_maths2 (lambda (x y z) (+ x (* (y 6 10) 2) (- z 5))))", env),
            0
        );
        assert.strictEqual(
            evalScheemString("(begin (define x more_maths) (multi_maths2 10 x 10))", env),
            55
        );
    });
    test('inner function uses values from enclosing function', function() {
        var env = {};
        assert.strictEqual(
            evalScheemString("(define multip (lambda (x y) (define add (lambda (z) (+ z y x))) (* (add 10) x y)))", env),
            0
        );
        assert.strictEqual(
            evalScheemString("(multip 10 5)", env),
            1250
        );
    });
    test('inner function modifies variable in outer function', function() {
        var env = {};
        assert.strictEqual(
            evalScheemString("(define multip (lambda (x y) (define add (lambda (z) (set! x 5) (+ z y x))) (* (add 10) x y)))", env),
            0
        );
        assert.strictEqual(
            evalScheemString("(multip 10 5)", env),
            500
        );
    });
});

/*suite('alerts', function() {
    test('normal alert', function() {
        assert.strictEqual(
            evalScheemString("(alert 'hello-world)"),
            'hello-world'
        );
    });
});*/

suite('example programs', function() {
    test('append one list to another', function() { 
        assert.deepEqual(
            evalScheemString("(append '(3 4) '(5 6))", {}),
            [3, 4, 5, 6]
        );
    });
    test('perform an operation then add to a list', function() { 
        assert.deepEqual(
            evalScheemString("(list '(3 4) (* 5 6))", {}),
            [[3, 4], 30]
        );
        assert.deepEqual(
            evalScheemString("(list '(3 4) (* 5 6) '(1 2))", {}),
            [[3, 4], 30, [1, 2]]
        );
    });
    test('apply function to each element in a list', function() {
        assert.deepEqual(
            evalScheemString("(each '(1 2 3) (lambda (el i) (* el i)))", {}),
            [0, 2, 6]
        );
    });
});   