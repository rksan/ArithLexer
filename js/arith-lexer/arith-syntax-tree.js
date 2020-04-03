import NodeType from './arith-node-type.js';
import SyntaxNode from './arith-node.js';
import Factory from './arith-lexer-factory.js';

//@BNF infix nation
//<formula> ::= <addsub>
//<addsub> ::= <muldiv> | <muldiv> ( '+' <muldiv> | '-' <muldiv> )*
//<muldiv> ::= <operand> | <operand> ( '*' <operand> | '/' <operand> )*
//<operand> ::= NUMBER | <selector>
//<selector> ::= '(' <formula> ')'
export default class {
    //_ArithInfixNotationSyntaxTree

    //@members
    #tokenizer; //tokenizer object
    #token; //token object
    #tree; //node tree

    //@param tokenizer
    constructor(tokenizer) {
        this.#tokenizer = tokenizer;
    }

    tree() {
        if (!this.#tree) {
            this.#tree = this._formula();
        }

        return this.#tree;
    }

    _hasNextToken() {
        return this.#tokenizer.hasNext();
    }

    _nextToken() {
        return (this.#token = this.#tokenizer.next());
    }

    _currentToken() {
        var token = this.#token;

        if (!token) {
            return this.#token = (this._hasNextToken() ? this._nextToken() : undefined);
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
            operator = this._createNode(token, NodeType.OPERATOR);

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
            operand = this._createNode(token, NodeType.OPERAND);

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
            selector = this._createNode(token, NodeType.SELECTOR_START);

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
            let right = this._createNode(token, NodeType.SELECTOR_END);

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
        let node = Factory.createSyntaxNode(token, type);
        return node;
    }
};
