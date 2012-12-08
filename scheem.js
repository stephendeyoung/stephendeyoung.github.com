var forEach = function(array, func, env) {
    var x = 0,
        length = array.length,
        values = [];
    while (x < length) {
        values.push(func(array[x], env));
        if (x === array.length - 1) {
            return values;
        }

        else {
            x += 1;
        }
    }
};

var new_scope = function(env) {

    if (env.bindings) {
        env.outer = {
            bindings: env.bindings,
            outer: env.outer
        };
        env.bindings = {};
    }

    else {
        env.outer = {};
        env.bindings = {};
    }
    return env;
};

var lookup = function(env, v) {
    if (!(env.hasOwnProperty('bindings'))) {
        throw new Error(v + ' not found');
    }

    if (env.bindings.hasOwnProperty(v)) {
        return env.bindings[v];
    }

    else {
        if (env.outer) {
            return env.outer.hasOwnProperty('bindings') ? lookup(env.outer, v) : lookup(initEnv, v);
        }

        else {
            return lookup(initEnv, v);
        }
    }
};

var update = function(env, v, val) {
    if (!(env.hasOwnProperty('bindings')))
        throw new Error(v + ' not found');
    if (env.bindings.hasOwnProperty(v)) {
        env.bindings[v] = val;
        return env;
    }

    else {
        return update(env.outer, v, val);
    }
};

var add_binding = function(env, v, val, initial) {

    if (initial) {
        env = {
            bindings: builtInFunctions(),
            outer: {}
        }
    }

    else {
        if (!env || !env.bindings) {
            env = {
                bindings: {},
                outer: {}
            }
        }
        env.bindings[v] = val;
    }
    return env;
};

var builtInFunctions = function() {

    var _slice = Array.prototype.slice;

    var env = {

        '+': function() {
            var array = _slice.apply(arguments),
                result = array.reduce(function(previousValue, currentValue) {
                    return previousValue + currentValue;
                });
            return result;
        },

        '-': function() {
            var array = _slice.apply(arguments),
                result = array.reduce(function(previousValue, currentValue) {
                    return previousValue - currentValue;
                });
            return result;
        },

        '*': function() {
            var array = _slice.apply(arguments),
                result = array.reduce(function(previousValue, currentValue) {
                    return previousValue * currentValue;
                });
            return result;
        },

        '/': function() {
            var array = _slice.apply(arguments),
                result = array.reduce(function(previousValue, currentValue) {
                    return previousValue / currentValue;
                });
            return result;
        },

        '=': function() {
            return arguments[0] === arguments[1] ? '#t' : '#f';
        },

        '<': function() {
            return arguments[0] < arguments[1] ? '#t' : '#f';
        },

        '>': function() {
            return arguments[0] > arguments[1] ? '#t' : '#f';
        },

        'cons': function() {
            var result = [];
            if (!arguments[1]) {
                throw new Error('You did not provide a second argument to cons');
            }

            else if (!arguments[1] instanceof Array) {
                throw new Error('Your second argument to cons was not a list');
            }

            else {
                result.push(arguments[0]);
                var len = arguments[1].length;
                for(var x = 0; x < len; x += 1) {
                    result.push(arguments[1][x]);
                }
                return result;
            }
        },

        'car': function() {
            if (!arguments[0][0] instanceof Array) {
                throw new Error('You did not provide a list');
            }

            else if (arguments[1]) {
                throw new Error('You provided more than one argument');
            }

            else {
                return arguments[0][0];
            }
        },

        'cdr': function() {
            if (!arguments[0][0] instanceof Array) {
                throw new Error('You did not provide a list');
            }

            else if (arguments[1]) {
                throw new Error('You provided more than one argument');
            }

            else {
                var result = _slice.apply(arguments[0]);
                result.splice(0, 1);
                return result;
            }
        },

        'alert': function() {
            if (arguments.length > 1) {
                throw new Error('More than 1 argument provided to alert');
            }
            alert(arguments[0]);
            return arguments[0];
        },

        'append': function() {
            if (arguments[0] instanceof Array === false || arguments[1] instanceof Array === false) {
                throw new Error('Something other than a list is being used to append');
            }
            var array = _slice.apply(arguments);
            return array[0].concat(array[1]);
        },

        'each': function() {
            var array = _slice.apply(arguments[0]);
            return array.map(arguments[1]);
        }

    }

    return env;
};

var initEnv = (function() {

    var env = add_binding(null, null, null, true);
    return env;

})();

var evalScheem = function(expr, env) {
    // Numbers evaluate to themselves
    if (typeof expr === 'number') {
        return expr;
    }

    if (typeof expr === 'string') {
        if (!env || !env.bindings) {
            env = {
                bindings: {},
                outer: {}
            }
        }
        return lookup(env, expr);
    }
    // Look at head of list for operation
    switch (expr[0]) {
        case 'quote':
            if (expr[2]) {
                throw new Error('You can only have one item in a list');
            }

            else {
                return expr[1];
            }
            break;
        case 'define':
            if (env.bindings === undefined) {
                env.bindings = {};
            }

            add_binding(env, expr[1], evalScheem(expr[2], env));
            return 0;
        case 'set!':
            if (lookup(env, expr[1]) === undefined) {
                throw new Error('You are trying to set a variable you have not defined');
            }

            else if (expr[2] === undefined) {
                throw new Error('You have not given a value');
            }

            else {
                if (env.bindings === undefined) {
                    env.bindings = {};
                }
                update(env, expr[1], evalScheem(expr[2], env));
                return env;
            }
            break;
        case 'let':
            if (!expr[2]) {
                throw new Error('No evaluation provided');
            }
            new_scope(env);
            var i = 0,
                ln = expr[1].length;
            while(i < ln) {
                if (typeof expr[1][i][0] !== 'string') {
                    throw new Error(expr[1][i][0] + ' is an invalid variable name');
                }
                add_binding(env, expr[1][i][0], evalScheem(expr[1][i][1], env));
                i += 1;
            }
            return evalScheem(expr[2], env);
        case 'begin':
            var x = 1,
                length = expr.length;
            while (x < length) {
                var result = evalScheem(expr[x], env);
                if (x === expr.length - 1) {
                    return result;
                }

                else {
                    x += 1;
                }
            }
            break;
        case 'if':
            var test = evalScheem(expr[1], env);
            if (test === '#t') {
                return evalScheem(expr[2], env);
            }

            else {
                return evalScheem(expr[3], env);
            }
            break;
        case 'list':
            var new_list = [],
                lists = expr.slice(1),
                ln = lists.length,
                c = 0;
            while (c < ln) {
                new_list.push(evalScheem(lists[c], env));
                c += 1;
            }
            return new_list;
        case 'lambda-one':
            return function(y) {
                new_scope(env);
                add_binding(env, expr[1], y);
                return evalScheem(expr[2], env);
            };
        case 'lambda':
            return function() {
                new_scope(env);
                var x = 0,
                    args_ = expr[1],
                    length_ = args_.length;
                while (x < length_) {
                    add_binding(env, args_[x], arguments[x]);
                    x += 1;
                }
                var variables = expr.slice(2);
                if (variables.length > 1) {
                    forEach(variables.slice(0, -1), evalScheem, env);
                }
                return evalScheem(variables.pop(), env);
            };
        default:
            var func = evalScheem(expr[0], env),
                x = 1,
                length = expr.length,
                args = [];
            while (x < length) {
                args.push(evalScheem(expr[x], env));
                x += 1;
            }
            return func.apply(null, args);
    }
};


// If we are used as Node module, export evalScheem
if (typeof module !== 'undefined') {
    module.exports.evalScheem = evalScheem;
}

else {

var evalScheemString = function(expr, env) {

    var result = evalScheem(SCHEEM.parse(expr), env);
    return result;
};
}
