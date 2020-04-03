class _ArithSyntaxNodeType {
    static SELECTOR_START = 'SELECTOR_START';
    static SELECTOR_END = 'SELECTOR_END';
    static OPERATOR = 'OPERATOR';
    static OPERAND = 'OPERAND';
};

class _ArithSyntaxNode {
    _parent = undefined;
    _children = [undefined, undefined]; //array of node object

    constructor(token, type) {
        this._token = token; //token object
        this._type = type; //string
    }

    //@return {token object}
    token() {
        return this._token;
    }

    //@return string: 'node type'
    type() {
        return this._type;
    }

    data() {
        return this.token().chars().join('');
    }

    //@setter
    //  @param node : {node object}.
    //  @return this
    //@getter
    //  @return {node object}
    parent(node) {
        if (arguments.length === 0) {
            //@getter
            return this._parent;
        } else {
            //@setter
            this._parent = node;
            return this;
        }
    }

    //@setter
    //  @param node : {node object}.
    //  @return this
    //@getter
    //  @return {node object}
    left(node) {
        if (arguments.length === 0) {
            //@getter
            return this._children[0];
        } else {
            //@setter
            this._children[0] = node;

            //parent is this node
            node.parent(this);

            return this;
        }
    }

    //@setter
    //  @param node : {node object}
    //  @return this
    //@getter
    //  @return {node object}
    right(node) {
        if (arguments.length === 0) {
            return this._children[1];
        } else {
            this._children[1] = node;

            //parent is this node
            node.parent(this);

            return this;
        }
    }

    //@return boolean
    isOperator() {
        return (this.type() === _ArithSyntaxNodeType.OPERATOR);
    }

    //@return boolean
    isOperand() {
        return (this.type() === _ArithSyntaxNodeType.OPERAND);
    }

    //@return boolean
    isSelector() {
        return (this.type() === _ArithSyntaxNodeType.SELECTOR_START);
    }

    //@return boolean
    isSelectorEnd() {
        return (this.type() === _ArithSyntaxNodeType.SELECTOR_END);
    }

    infix() {
        var data = this.data();

        if (this.isOperand()) {
            return data;
        } else {
            let left = this.left();
            let right = this.right();

            left = (left ? left.infix() : '');
            right = (right ? right.infix() : '');

            if (this.isSelector()) {
                //(operand)
                return [data, left, right].join('');
            } else if (this.isSelectorEnd()) {
                return data;
            } else {
                //operand operator operand
                return [left, data, right].join(' ');
            }
        }
    }

    prefix(showSelector) {
        var data = this.data();

        if (this.isOperand()) {
            return data;
        } else {
            let left = this.left();
            let right = this.right();

            left = (left ? left.prefix(showSelector) : '');
            right = (right ? right.prefix(showSelector) : '');

            if (this.isSelector()) {
                //(operand)
                return showSelector === true ? [data, left, right].join('') : left;
            } else if (this.isSelectorEnd()) {
                return showSelector === true ? data : '';
            } else {
                //operand operator operand
                return [data, left, right].join(' ');
            }
        }
    }

    postfix(showSelector) {
        var data = this.data();

        if (this.isOperand()) {
            return data;
        } else {
            let left = this.left();
            let right = this.right();

            left = (left ? left.postfix(showSelector) : '');
            right = (right ? right.postfix(showSelector) : '');

            if (this.isSelector()) {
                //(operand)
                return showSelector === true ? [data, left, right].join('') : left;
            } else if (this.isSelectorEnd()) {
                return showSelector === true ? data : '';
            } else {
                //operand operator operand
                return [left, right, data].join(' ');
            }
        }
    }

    toString() {
        return this.infix();
    }

};

//@BNF infix nation
//<formula> ::= <addsub>
//<addsub> ::= <muldiv> | <muldiv> ( '+' <muldiv> | '-' <muldiv> )*
//<muldiv> ::= <operand> | <operand> ( '*' <operand> | '/' <operand> )*
//<operand> ::= NUMBER | <selector>
//<selector> ::= '(' <formula> ')'
class _ArithInfixNotationSyntaxTree {
    //@members
    _tokenizer; //tokenizer object
    _token; //token object
    _tree; //node tree

    //@param tokenizer
    constructor(tokenizer) {
        this._tokenizer = tokenizer;
    }

    tree() {
        if (!this._tree) {
            this._tree = this._formula();
        }

        return this._tree;
    }

    _hasNextToken() {
        return this._tokenizer.hasNext();
    }

    _nextToken() {
        return (this._token = this._tokenizer.next());
    }

    _currentToken() {
        var token = this._token;

        if (!token) {
            return this._token = (this._hasNextToken() ? this._nextToken() : undefined);
        }

        return token;
    }

    //@return node
    _formula() {
        return this._addsub();
    }

    //@return node
    _addsub() {
        var token;
        var addsub = this._muldiv();

        //get current
        token = this._currentToken();

        //Repeat as long as token is '+' or '-'
        while (token && (token.isPlus() || token.isMinus())) {
            let left = addsub;
            let middle = this._operator();
            let right = this._muldiv();

            middle.left(left).right(right);

            addsub = middle;

            //get current
            token = this._currentToken();
        }

        return addsub;
    }

    //@return node
    _muldiv() {
        var token;
        var muldiv = this._operand();

        //get current
        token = this._currentToken();

        //Repeat as long as token is '*' or '/'
        while (token && (token.isStar() || token.isSlash())) {
            let left = muldiv;
            let middle = this._operator();
            let right = this._operand();

            middle.left(left).right(right);

            muldiv = middle;

            //get current
            token = this._currentToken();
        }

        return muldiv;
    }

    //@return node
    _operator() {
        var token;
        var operator;

        //get current
        token = this._currentToken();

        if (token && token.isOperator()) {
            //make operator node.
            operator = this._createNode(token, _ArithSyntaxNodeType.OPERATOR);

            //seek next.
            token = this._nextToken();
        } else {
            throw new Error('syntax error: is not operator [' + token + ']');
        }

        return operator;
    }

    _operand() {
        var token;
        var operand;

        //get current
        token = this._currentToken();

        if (token.isNumber()) {
            //make operand node.
            operand = this._createNode(token, _ArithSyntaxNodeType.OPERAND);

            //seek next.
            token = this._nextToken();

        } else {
            operand = this._selector();
        }

        return operand;
    }

    _selector() {
        var token;
        var selector;

        //get current
        token = this._currentToken();

        if (token.isLeftSelector()) {
            //make operand node.
            selector = this._createNode(token, _ArithSyntaxNodeType.SELECTOR_START);

            //seek next.
            token = this._nextToken();

            //make left node.
            let left = this._formula();

            //get current
            token = this._currentToken();

            if (!token.isRightSelector()) {
                throw new Error('syntax error: do not end selector [' + token + ']');
            }

            //make rignt node.
            let right = this._createNode(token, _ArithSyntaxNodeType.SELECTOR_END);

            selector.left(left).right(right);

            //seek next
            token = this._nextToken();

        } else {
            throw new Error('syntax error: undefined token [' + token + ']');
        }

        return selector;
    }

    //@param token
    //@param type
    //@return node
    _createNode(token, type) {
        var node = new _ArithSyntaxNode(token, type);
        return node;
    }
};

class _ArithParser {
    //@members
    _syntax; //string
    _syntaxTree; //syntax tree object
    _factory;

    constructor(syntax, factory) {
        this._syntax = syntax;
        this._factory = factory;
    };

    factory() {
        return this._factory;
    }

    parse() {
        var syntaxTree = this._syntaxTree;

        if (!syntaxTree) {
            var factory = this.factory();
            var tokenizer = factory._tokenizer(this._syntax);
            syntaxTree = factory._syntaxTree(tokenizer);
            this._syntaxTree = syntaxTree;
        }

        return syntaxTree;
    }

};

class _ArithFactory {
    //@param syntax : string
    //@return parser : new instance
    static parser(syntax) {
        return this._parser(syntax);
    }

    //@return syntax : string
    //@return Parser : new instance
    static _parser(syntax) {
        return new _ArithParser(syntax, this);
    }

    //@param tokenizer: Tokenizer object
    //@return SyntaxTree : new instance
    static _syntaxTree(tokenizer) {
        return new _ArithInfixNotationSyntaxTree(tokenizer);
    }

    //@return syntax : string
    //@return Tokenizer : new instance
    static _tokenizer(syntax) {
        return new _ArithTokenizer(syntax);
    }

    static _tokenType() {
        return _ArithTokenType;
    }
};

class _ArithDecimalFormat {
    static MARK_SIGN = '-';
    static MARK_DOT = '.';
    static DECIMAL_MAX_DIGIT = 16;
};

var _ArithDecimal = class _ArithDecimal {
    _mark_sign = '-';
    _mark_dot = '.';
    _decimal_max_digit = 16;
    _sign = '';
    _naturals = [];
    _decimals = [];

    constructor(chars, mark_sign, mark_dot) {
        this._chars = chars || [];
        this._mark_sign = mark_sign;
        this._mark_dot = mark_dot;

        //set number
        this.number(chars);
    }

    create(chars) {
        return new _ArithDecimal(chars, this._mark_sign, this._mark_dot);
    }

    toString() {
        return this.number().join('');
    }

    toNumber() {
        return Number(this.toString());
    }

    number(chars) {
        if (arguments.length === 0) {
            //@getter
            let ints = this.integer();
            let decs = this.decimal();

            if (decs.length === 0) {
                return ints;
            } else {
                return [].concat(ints, [this._mark_dot], decs);
            }

        } else {
            //@setter
            let ary = this._sliceOfDecimal(chars);

            if (0 < ary[0].length) {
                this.integer(ary[0]);
            }

            if (0 < ary[1].length) {
                this.decimal(ary[1]);
            }
        }
        return this;
    }

    //@getter
    //  @return chars
    //@setter
    //  @param chars : <char array> ::= ['-'] INTEGER* ['.' DECIMAL*]
    //  @turn this
    integer(chars) {
        if (arguments.length === 0) {
            //@getter
            let ints = this.natural();
            let sign = this.sign();

            if (sign) {
                ints = [].concat([sign], ints);
            }

            return ints;
        } else {
            //@setter
            let ints = chars;

            //sign
            if (this._hasSign(ints)) {
                //delete
                ints = ints.slice(0);
                ints.shift();

                this.sign(true);
            } else {
                this.sign(false)
            }

            //decimal
            let ary = this._sliceOfDecimal(ints);

            ints = ary[0];

            this.natural(ints);

            return this;
        }
    }

    //@renge (0 <= N)
    //@param chars
    natural(chars) {
        if (arguments.length === 0) {
            //@getter
            return this._naturals;
        } else {
            //@setter
            let nats = chars;

            //sign
            if (this._hasSign(nats)) {
                //delete
                nats = nats.slice(0);
                nats.shift();
            }

            if (nats.length === 0) {
                nats = [];
            } else {
                let ary = this._sliceOfDecimal(nats);
                nats = ary[0];
            }

            this._naturals = nats;

            return this;
        }
    }

    //@getter
    //  @return chars
    //@setter
    //  @param chars : char array
    //  @turn this
    decimal(chars) {
        if (arguments.length === 0) {
            //@getter
            return this._decimals;
        } else {
            //@setter
            let ary = this._sliceOfDecimal(chars);
            let decs;

            if (ary[1].length === 0) {
                decs = ary[0];
            } else {
                decs = ary[1];
            }

            this._decimals = decs;
        }

        return this;
    }

    isZero() {
        let nats = this.natural();

        if ((nats[0] === '0') && (nats.length === 1)) {
            let decs = this.decimal();

            if ((decs.length === 0) || (decs.length === 1 && decs[0] === '0')) {
                return true;

            } else {
                return decs.every(function (value) {
                    return value === '0';
                });
            }
        }

        return false;
    }

    //@return chars
    abs(chars) {
        if (arguments.length === 0) {
            //@getter
            let nums = this.number();
            return this._abs(nums);
        } else {
            //@setter
            let nums = this._abs(nums);
            this.number(nums);
            return this;
        }

    }

    //@return number
    digit() {
        //@getter
        let nats = this.natural();
        let decs = this.decimal();
        return (nats.length + decs.length);
    }


    //@param sign: boolean
    sign(sign) {
        if (arguments.length === 0) {
            //@getter
            return this._sign;
        } else {
            //@setter
            if (sign === true) {
                this._sign = this._mark_sign;
            } else {
                this._sign = '';
            }

            return this;
        }
    }

    toggleSign() {
        if (this.hasSign() === true) {
            this.sign(false);
        } else {
            this.sign(true);
        }
        return this;
    }

    //@return boolean
    hasSign() {
        return (this.sign() !== '');
    }

    //@return boolean
    hasDecimal() {
        let decs = this.decimal();
        return (0 < decs.length);
    }

    _decimal_max_digit(digit) {
        if (arguments.length === 0) {
            //@getter
            return this._decimal_max_digit;
        } else {
            //@setter
            this._decimal_max_digit = (typeof digit === 'number' ? digit : Number(digit));
            return this;
        }
    }

    //@return char array
    _abs(chars) {
        //@getter
        if (this._hasSign(chars)) {
            return chars.slice(1);
        } else {
            return chars.slice(0);
        }
    }

    //@return boolean
    _hasSign(chars) {
        return (this._indexOfSign(chars) === 0);
    }

    //@return index
    _indexOfSign(chars) {
        return chars.indexOf(this._mark_sign);
    }

    //@return boolean
    _hasDeimal(chars) {
        return (this._indexOfDecimal(chars) !== -1);
    }

    //@return index
    _indexOfDecimal(chars) {
        return (chars.indexOf(this._mark_dot));
    }

    _sliceOfDecimal(chars) {
        let index = this._indexOfDecimal(chars);
        if (index === -1) {
            return [chars, []];
        } else {
            return [chars.slice(0, index), chars.slice(index + 1)];
        }
    }
};

var _ArithOperator = class _ArithOperator {
    _mark_sign = '-';
    _mark_dot = '.';
    _operand = []; //max length is 2.
    _integer = [];
    _decimal = [];
    _max_digit = 0;
    //_has_sign = [false, false];
    _has_deimal = [false, false];

    constructor(left, right) {
        this._init(left, right);
    }

    plus() {
        //(x + y)
        return this._toAdd();
    }

    minus() {
        //(x - y) -> (x + -y)
        this._operand[1].toggleSign();

        return this._toAdd();
    }

    star() {
        //(x * y)
        return this._toMulti();
    }

    slash() {
        return this._toDiv();
    }

    //--local
    _init() {
        let args = [];
        let ary = [];
        let hasDecimals = [];

        let digit = 0;
        let maxDigit = 0;

        for (let i = 0, len = arguments.length; i < len; i++) {
            if (Array.isArray(arguments[i])) {
                ary = arguments[i].slice(0);
            } else {
                ary = arguments[i].number();
            }

            args[i] = this._createOperand(ary);

            hasDecimals.push(args[i].hasDecimal());

            digit = args[i].digit();

            if (maxDigit < digit) {
                maxDigit = digit;
            }
        }

        this._operand = args;
        this._max_digit = maxDigit;
        this._has_deimal = hasDecimals;

        return this;
    }

    _create(chars) {
        return new _ArithDecimal(chars, this._mark_sign, this._mark_dot);
    }

    //@param chars: number chars
    //[@param chars1: as decimal]
    //@return Decimal
    _createOperand(chars) {
        let buffer;

        if (arguments[1] === undefined) {
            buffer = chars;
        } else {
            buffer = chars.concat(this._mark_dot, arguments[1]);
        }

        return new _ArithDecimal(buffer, this._mark_sign, this._mark_dot);
    }

    //@param left : chars or Decimal
    //@param right : chars or Decimal
    _createOperator(left, right) {
        return new _ArithOperator(left, right);
    }

    //@param left : Decimal
    //@param right : Decimal
    //@param digit : max length
    //@return number
    //(left === chars1) = 0
    //(left < right) = 1
    //(left > right) = -1
    _compare(left, right, mode) {
        let ite;

        if (arguments.length === 1) {
            ite = left;
        } else {
            ite = this._createIterator(left, right, mode);
        }

        let res = 0;

        while (ite.hasNext()) {
            let oper = ite.next();
            let char0 = oper.left;
            let char1 = oper.right;

            if (char0 < char1) {
                res = 1;
                break;
            } else if (char0 > char1) {
                res = -1;
                break;
            }
        }

        if (arguments.length === 1) {
            ite.seekFirst();
        }

        return res;
    }

    _swap() {
        let ary = [];

        if (1 < arguments.length) {
            for (let i = 0, len = arguments.length; i < len; i++) {
                ary.push(arguments[i]);
            }
        } else {
            ary = arguments[0];
        }

        //swap
        let buffer;

        buffer = ary[0];
        ary[0] = ary[1];
        ary[1] = buffer;

        return ary;
    }

    //@param left : left operand
    //@param right : right operand
    //@param mode : 'integer' mode, or 'decimal' mode.
    //@param from : from 'first' or from 'last'
    //@comment
    //When performing arithmetic operations in "integer" mode,
    //match the last digits of the left and right integer values ​​and fill in the missing digits of the first digit with "0".
    //In "decimal" mode, it matches the decimal point and fills in missing digits with "0".
    //
    //When performing a numeric comparison,
    //the missing numbers are padded with "0", as in arithmetic calculations,
    //and the comparison is performed from the beginning of the displayed number.
    //
    //However, when actually embedding a number,
    //embedding of the number is not performed because the number of digits increases the calculation complexity,
    //and the number is set to "0" when it is outside the array.
    _createIterator(left, right, mode, from) {
        class __LikeIterator {
            constructor(chars, signs, digit, mode) {
                this._signs = signs;
                this._chars = chars;

                this._modeTxt = (mode || 'integer');
                this._mode = (this._modeTxt === 'decimal' ? true : false);

                if (this._mode === true) {
                    //decimal mode
                    ////in. left=[1,2,3] right=[4,5,6,7]
                    //from last as default

                    this._fromTxt = (from || 'last');

                } else {
                    //integer mode
                    //in. left=[1,2,3] right=[4,5,6,7] -> out. left=[3,2,1] right=[7,6,5,4]
                    //from first as default

                    this._chars[0] = this._chars[0].reverse();
                    this._chars[1] = this._chars[1].reverse();

                    this._fromTxt = (from || 'first');
                }

                this._from = (this._fromTxt === 'last' ? true : false);

                if (this._from === true) {
                    //from last
                    this._range = [0, digit - 1];

                    this.seekFirst = function () {
                        this._limit = this._range[0]; //min
                        this._idx = this._range[1]; //max
                    }
                    this.hasNext = function () {
                        return (this._limit <= this._idx);
                    }
                    this.seekNext = function () {
                        return this._idx--;
                    }
                } else {
                    //from first
                    this._range = [digit, 0];

                    this.seekFirst = function () {
                        this._limit = this._range[0]; //max
                        this._idx = this._range[1]; //min
                    }
                    this.hasNext = function () {
                        return (this._idx < this._limit);
                    }
                    this.seekNext = function () {
                        return this._idx++;
                    }
                }

                this.seekFirst();
            }

            next() {
                if (this.hasNext() === true) {
                    let digit = this.seekNext();
                    return {
                        'left': (this._chars[0][digit] || '0'),
                        'right': (this._chars[1][digit] || '0')
                    };
                }
            }

            swapOperand(fn_swap) {
                fn_swap(this._chars);
                fn_swap(this._signs);
            }

        }//end class

        //set up iterator
        let digit = this._max_digit;

        //Remember that either is a negative number
        let signs = [left.hasSign(), right.hasSign()];

        let chars = [left.abs(), right.abs()];

        let ite = new __LikeIterator(chars, signs, digit, mode);

        return ite;
    }

    //[@param mode: 'integer' or 'decimal']
    //@return ArithDecimal
    _toAdd(mode) {
        // as 'integer' mode.
        //  [1, 2, 3] |      [1, 2] |   [1, 2, 3]
        //+ [4, 5, 6] | + [3, 4, 5] | +    [4, 5]
        //----------- | ----------- | -----------
        //  [5, 7, 9] |   [3, 6, 7] |   [1, 6, 8]
        //
        //  [-, 1, 2, 3] |         [1, 2] |   [-, 1, 2, 3]
        //+    [4, 5, 6] | + [-, 3, 4, 5] | +    [-, 4, 5]
        //-------------- | -------------- | --------------
        //     [3, 3, 3] |   [-, 3, 3, 3] |   [-, 1, 6, 8]
        //
        //as 'decimal' mode.
        //  [1, 2, 3, ., 4, 5, 6] |      [1, 2, ., 3, 4]    |   [1, 2, 3, ., 4, 5, 6]
        //+ [7, 8, 9, ., 0, 1, 2] | + [5, 6, 7, ., 8, 9, 0] | +    [7, 8, ., 9, 0]
        //----------------------- | ----------------------- | -----------------------
        //  [9, 1, 2, ., 4, 6, 8] |   [5, 8, 0, ., 2, 3, 0] |   [2, 0, 2, ., 3, 5, 6]

        let hasDec = (this._has_deimal[0] || this._has_deimal[1]);

        if (hasDec === true) {
            //decimal
            let sign = [this._operand[0].hasSign(), this._operand[1].hasSign()];
            let int = [this._operand[0].integer(), this._operand[1].integer()];
            let dec = [this._operand[0].decimal(), this._operand[1].decimal()];

            let opeInt = this._createOperator(int[0], int[1]);
            let opeDec = this._createOperator(dec[0], dec[1]);
            let maxDigit = opeDec._max_digit;

            if (sign[0]) {
                //(-1.1) -> [-1, 0.1] -> [-1, -0.1]
                opeDec._operand[0].sign(true);
            }

            if (sign[1]) {
                //(-1.1) -> [-1, 0.1] -> [-1, -0.1]
                opeDec._operand[1].sign(true);
            }

            let resInt = opeInt._toAdd('integer');
            let resDec = opeDec._toAdd('decimal');

            if (maxDigit < resDec.digit()) {
                //Up from decimal part to integer part

                //(F)1.9 + 0.2
                // = { 1 + 0 } + { 0.9 + 0.2 }
                //    -> { 1 } + { '.' ( 9 + 2 ) }
                //    -> { 1 } + { '.' 11 }
                // = { 1 } + { 1.1 }
                //    -> { 1 } + { 1 '.' 1 }
                //    -> { 1 + 1 } + { '.' 1 }
                //    -> { 2 } + { '.' 1 }
                // = { 2 } + { 0.1 }
                //    -> { 2 } + { '.' 1 }
                // = 2.1

                let abs;
                let advance;
                let opeAdv;

                //integer part
                advance = this._createOperand(['1']);

                opeAdv = this._createOperator(resInt, advance);

                resInt = opeAdv._toAdd('integer');

                //decimal part
                abs = resDec.abs();
                abs.shift();

                //operand
                return this._createOperand(resInt.integer(), abs);

            } else if ((resInt.hasSign() !== resDec.hasSign()) && resInt.isZero() !== true) {
                //Down from integer part to decimal part

                //(F)1.2 - 0.3
                // = { 1 - 0 } + { 0.2 - 0.3 }
                //    -> { 1 } + { '.' (2 - 3) }
                //    -> { 1 } + { '-' '.' (3 - 2) }
                //    -> { 1 } + { '-' '.' 1 }
                // = { 1 } + { -0.1 }
                //    -> { 1 - 1 } + { 1 - 0.1 }
                //    -> { 0 } + { (0.1 - 0.01) * 10 }
                //    -> { 0 } + { '.' ( 10 - 01 ) }
                //    -> { 0 } + { '.' 9 }
                // = { 0 } + { 0.9 }
                // = 0.9

                //(F)4.23 - 1.56
                // = { 4 - 1 } + { 0.23 - 0.56 }
                //    -> { 3 } + { '.' (23- 56) }
                //    -> { 3 } + { '-' '.' (56 - 23) }
                //    -> { 3 } + { '-' '.' 33 }
                // = { 3 } + { -0.33 }
                //    -> { 3 - 1 } + { 1 - 0.33}
                //    -> { 2 } + { (0.1 - 0.033) * 10 }
                //    -> { 2 } + { '.' (100 - 033) }
                //    -> { 2 } + { '.' 67 }
                // = 2.67

                let abs;
                let advance;
                let opeAdv;

                //integer part
                advance = this._createOperand(['1']);
                advance.sign(true);

                opeAdv = this._createOperator(resInt, advance);

                resInt = opeAdv._toAdd('integer');

                //decimal part
                abs = resDec.abs();
                abs.unshift('0');

                resDec = this._createOperand(abs);
                resDec.sign(true);

                advance = this._createOperand(['1']);
                opeAdv = this._createOperator(advance, resDec);

                resDec = opeAdv._toAdd('decimal');

                abs = resDec.abs();
                abs.shift();

                resDec = this._createOperand(abs);

                return this._createOperand(resInt.integer(), resDec.abs());

            } else {
                //(F)4.56 - 1.23
                // = { 4 - 1 } + { 0.56 - 0.23 }
                //    -> { 3 } + { '.' (56 - 23) }
                //    -> { 3 } + { '.' 33 }
                // = { 3 } + { 0.33 }
                //    -> { 3 } + { '.' 33 }
                //    -> { 3 '.' 33 }
                // = 3.33
                //
                //(F)1.56 - 1.23
                // = { 1 - 1 } + { 0.56 - 0.23 }
                //    -> { 0 } + { '.' (56 - 23) }
                //    -> { 0 } + { '.' 33 }
                // = { 0 } + { 0.33 }
                //    -> { 0 } + { '.' 33 }
                //    -> { 0 '.' 33 }
                // = 0.33
                //
                //(F)1.23 - 4.56
                // = { 1 - 4 } + { 0.23 - 0.56 }
                //    -> { '-' (4 - 1) } + {'.' (23 - 56) }
                //    -> { '-' 3 } + { '-' '.' (56 - 23) }
                //    -> { -3 } + { '-' '.' 33 }
                // = { -3 } + { -0.33 }
                //    -> { '-' 3 } + { '-' '.' 33 }
                //    -> '-' { 3 '.' 33 }
                // = -3.33
                //
                //(F)1.23 - 1.56
                // = { 1 - 1 } + { 0.23 - 0.56 }
                //    -> { 0 } + {'.' (23 - 56) }
                //    -> { 0 } + { '-' '.' (56 - 23) }
                //    -> { 0 } + { '-' '.' 33 }
                // = { 0 } + { -0.33 }
                //    -> { 0 } + { '-' '.' 33 }
                //    -> '-' { 0 '.' 33 }
                // = 3.33

                //integer part
                if (resInt.isZero() && resDec.hasSign()) {
                    resInt.sign(true)
                }

                return this._createOperand(resInt.integer(), resDec.abs());

            }

        } else {
            //integer

            let left = this._operand[0];
            let right = this._operand[1];
            let iterator;

            if (mode === 'decimal') {
                iterator = this._createIterator(left, right, mode, 'first');

                if (this._compare(iterator) === 1) {
                    let ary = this._swap(left, right);
                    left = ary[0];
                    right = ary[1];
                }
            } else {
                iterator = this._createIterator(left, right, mode, 'last');

                if (this._compare(iterator) === 1) {
                    let ary = this._swap(left, right);
                    left = ary[0];
                    right = ary[1];
                }
            }

            iterator = this._createIterator(left, right, mode);

            let advance = 0;
            let result = [];
            let addMode = (iterator._signs[0] === iterator._signs[1]);

            while (iterator.hasNext()) {
                let oper = iterator.next();
                let x = Number(oper.left); //left operand
                let y = Number(oper.right); //right operand
                let z = 0;

                if (addMode === true) {
                    //Both sides are positive or both sides are negative.
                    //
                    //add mode
                    //has sign, [true, true] or [false, false]
                    z = x + y + advance;

                    if (10 <= z) {
                        advance = 1;
                        result.push(('' + z).charAt(1));
                    } else {
                        advance = 0;
                        result.push(('' + z).charAt(0));
                    }
                } else {
                    //The signs on both sides do not match.
                    //The value on the left side is always larger than the value on the right side (replaced in advance).
                    //
                    //sub mode.
                    //has sign, [false, true] or [true, false]
                    x -= advance;

                    if (x < y) {
                        z = 10 + x - y;
                        advance = 1;
                    } else {
                        z = x - y;
                        advance = 0;
                    }

                    result.push(('' + z).charAt(0));
                }

            }

            if (0 < advance) {
                result.push('' + advance);
            }

            if ((iterator._signs[0] && iterator._signs[1]) || (iterator._signs[0] && !iterator._signs[1])) {
                //sign(true, true) or sign(true, false)
                //If the left side is negative, the result will always be negative
                result.push(this._mark_sign);
            }

            return this._createOperand(result.reverse());
        }
    }

    _toMulti() {
        let hasDec = (this._has_deimal[0] || this._has_deimal[1]);

        if (hasDec === true) {
            //decimal
            let sign = [this._operand[0].hasSign(), this._operand[1].hasSign()];
            let int = [this._operand[0].integer(), this._operand[1].integer()];
            let dec = [this._operand[0].decimal(), this._operand[1].decimal()];
            let decLen = dec[0].length + dec[1].length;

            let _fn_concat = function (ary0, ary1) {
                let ary;
                if (ary0.length === 1 && ary0[0] === '0') {
                    ary = [].concat(ary1);
                } else {
                    ary = ary0.concat(ary1);
                }
                return ary;
            }

            //Convert decimal to integer
            let chars0 = _fn_concat(int[0], dec[0]);
            let chars1 = _fn_concat(int[1], dec[1]);

            //Calculate as integer
            let ope = this._createOperator(chars0, chars1);
            let res = ope.star();

            //Get absolute value
            let chars = res.abs();

            //When the number of digits in the calculation result is the same or less than the decimal digits before calculation
            if (chars.length <= decLen) {
                //Integer is '0'
                chars0 = ['0'];

                chars1 = [];

                //Fill in missing digits with '0'
                for (let i = 0, len = (decLen - chars1.length); i < len; i++) {
                    chars1.push('0');
                }

                //The rest is a decimal
                chars1 = chars1.concat(chars);

            } else {
                //Number of digits in integer part
                let idx = chars.length - decLen;

                //Divide by integer and fraction
                chars1 = chars.slice(idx);
                chars0 = chars.slice(0, idx);
            }

            res = this._createOperand(chars0, chars1);

            if (sign[0] || sign[1]) {
                //mark sign
                res.sign(true);
            }

            return res;

        } else {
            //integer
            let sign = [this._operand[0].hasSign(), this._operand[1].hasSign()];
            let left = this._operand[0].abs();
            let right = this._operand[1].abs().reverse();
            let maxDigit = this._operand[1].digit();
            let adds = [];

            for (let digit = 0; digit < maxDigit; digit++) {
                let chars0 = left.slice(0);
                let chars1;

                let maxCount = Number(right[digit]);

                if (maxCount === 0) {
                    //must be '0'
                    chars0 = ['0'];
                } else {
                    //Increase the left side by the number of times on the right side
                    for (let i = 0; i < (maxCount - 1); i++) {
                        chars1 = left.slice(0);
                        let ope = this._createOperator(chars0, chars1);
                        let res = ope.plus();
                        chars0 = res.abs();
                    }
                }

                //Adjust the number of digits
                for (let i = 0; i < digit; i++) {
                    chars0.push('0');
                }

                //Stored for the next addition process
                adds.push(chars0);
            }

            //addition
            let chars0;
            let chars1;

            for (let i = 0, len = adds.length; i < len; i++) {
                if (chars0 === undefined) {
                    chars0 = adds[i]; //left side
                } else {
                    chars1 = adds[i]; //right side

                    let ope = this._createOperator(chars0, chars1);
                    let res = ope.plus();

                    chars0 = res.abs();
                    chars1 = undefined;
                }
            }

            //When everything is added, that is the result of the operation
            let res = this._createOperand(chars0);

            if (sign[0] || sign[1]) {
                //mark sign
                res.sign(true);
            }

            return res;
        }
    }

    _toDiv() {
        let hasDec = (this._has_deimal[0] || this._has_deimal[1]);

        if (hasDec === true) {
            //decimal
            let signs = [this._operand[0].hasSign(), this._operand[1].hasSign()];
            let int = [this._operand[0].integer(), this._operand[1].integer()];
            let dec = [this._operand[0].decimal(), this._operand[1].decimal()];
            let decLen = dec[0].length + dec[1].length;

            let _fn_concat = function (ary0, ary1) {
                let ary;
                if (ary0.length === 1 && ary0[0] === '0') {
                    ary = [].concat(ary1);
                } else {
                    ary = ary0.concat(ary1);
                }
                return ary;
            }

            //Convert decimal to integer
            let chars0 = _fn_concat(int[0], dec[0]);
            let chars1 = _fn_concat(int[1], dec[1]);

            //Calculate as integer
            let ope = this._createOperator(chars0, chars1);
            let res = ope.slash();
            let chars;

            if (res.hasDecimal()) {
                chars0 = res.integer();
                chars1 = res.decimal();

                decLen += chars1.length;

                chars = _fn_concat(chars0, chars1);

            } else {
                //Get absolute value
                chars = res.abs();
            }

            chars0 = chars.slice(0, decLen - 1);
            chars1 = chars.slice(decLen - 1)

            res = this._createOperand(chars0, chars1);

            if (signs[0] !== signs[1]) {
                res.sign(true);
            }

            return res;

        } else {
            //integer
            let signs = [this._operand[0].hasSign(), this._operand[1].hasSign()];
            let left = this._operand[0].abs();
            let right = this._operand[1].abs();

            let char0 = [];
            let char1;
            let result = [];
            let counter = 0;
            let zero = this._createOperand(['0']);
            let extra = left[0] ? [left[0]] : [];
            let len = left.length;

            for (var i = 0; i < len; i++) {
                char0.push(left[i] || '0');
                char1 = right;

                while (true) {
                    let ope = this._createOperator(char0, char1);
                    let res = ope.minus();

                    if (res.hasSign() === true || res.isZero() === true) {
                        //end
                        result.push('' + counter);

                        let comp = this._compare(zero, this._createOperand(extra), 'integer');

                        if (comp === 1) {
                            //0 < extra
                            char0 = extra.slice(0);
                            len++;
                            extra = [];
                        } else {
                            char0 = [];
                        }

                        counter = 0;
                        break; //end
                    } else {
                        //loop next
                        char0 = res.abs();
                        counter++;
                        extra = res.abs();
                    }
                }
            }

            let res;

            if (left.length < len) {
                //has decimal
                let idx = (len - left.length);

                let chars0 = result.slice(0, idx);
                let chars1 = result.slice(idx);

                res = this._createOperand(chars0, chars1);
            } else {
                res = this._createOperand(result);
            }

            if (signs[0] !== signs[1]) {
                res.sign(true);
            }

            return res;
        }
    }
};

class _Arith {
    static _factory;

    static factory(factory) {
        if (arguments.length === 0) {
            return this._factory;
        } else {
            this._factory = factory;
            return this;
        }
    }

    //@param formula: string of 'infix notation'
    //[@param factory: Factory class]
    //@return Node : abstract syntax tree object.
    static parseTree(syntax) {
        var factory = arguments[1] || _ArithFactory;

        this.factory(factory);

        var parser = factory.parser(syntax);
        var syntaxTree = parser.parse();
        var tree = syntaxTree.tree();

        return tree;
    }

    //@param syntax : infix notation.
    //@return string : infix notation.
    static infix(syntax) {
        var tree;

        if (typeof syntax === 'string') {
            tree = this.parseTree.apply(this, arguments);
        } else {
            tree = syntax;
        }

        return tree.infix();
    }

    //@param syntax : infix notation.
    //@return string : prefix notation.
    static prefix(syntax) {
        var tree;

        if (typeof syntax === 'string') {
            tree = this.parseTree.apply(this, arguments);
        } else {
            tree = syntax;
        }

        return tree.prefix();
    }

    //@param syntax : infix notation.
    //@return string : postfix notation.
    static postfix(syntax) {
        var tree;

        if (typeof syntax === 'string') {
            tree = this.parseTree.apply(this, arguments);
        } else {
            tree = syntax;
        }

        return tree.postfix();
    }

    //@param syntax : infix notation.
    //@return number : result
    static calc(syntax) {
        var tree;
        var dot = this.factory()._tokenType().DOT;

        if (typeof syntax === 'string') {
            tree = this.parseTree.apply(this, arguments);
        } else {
            tree = syntax;
        }

        var result = _do(tree);

        return result;

        function _do_chars(node) {
            if (node.isOperand()) {
                //operand
                let token = node.token();
                let chars = token.chars();
                return chars;

            } else if (node.isOperator()) {
                //operator
                let chars0 = _do_chars(node.left());
                let chars1 = _do_chars(node.right());

                let token = node.token();
                let result = [];
                let ope = new _ArithOperator(chars0, chars1);

                if (token.isPlus()) {
                    result = ope.plus();

                } else if (token.isMinus()) {
                    result = ope.minus();

                } else if (token.isStar()) {
                    result = ope.star();

                } else if (token.isSlash()) {
                    result = ope.slash();
                }

                return result;

            } else if (node.isSelector()) {
                //selector
                let token = node.token();
                let result = 0;

                if (token.isLeftSelector()) {
                    let left = node.left();
                    //let right = node.right();

                    result = _do_chars(left);// + _do(right);
                }

                return result;
            } else {
                return 0;
            }
        }

        //@param node : {node object}
        //@return number
        function _do(node) {
            let chars = _do_chars(node);
            return Number(chars.toString());
        }
    }
};