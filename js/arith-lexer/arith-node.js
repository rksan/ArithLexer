import NodeType from './arith-node-type.js';

export default class {
    //_ArithSyntaxNode

    #parent = undefined;
    #children = [undefined, undefined]; //array of node object
    #token;
    #type;
    
    constructor(token, type) {
        this.#token = token; //token object
        this.#type = type; //string
    }

    //@return {token object}
    token() {
        return this.#token;
    }

    //@return string: 'node type'
    type() {
        return this.#type;
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
            return this.#parent;
        } else {
            //@setter
            this.#parent = node;
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
            return this.#children[0];
        } else {
            //@setter
            this.#children[0] = node;

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
            return this.#children[1];
        } else {
            this.#children[1] = node;

            //parent is this node
            node.parent(this);

            return this;
        }
    }

    //@return boolean
    isOperator() {
        return (this.type() === NodeType.OPERATOR);
    }

    //@return boolean
    isOperand() {
        return (this.type() === NodeType.OPERAND);
    }

    //@return boolean
    isSelector() {
        return (this.type() === NodeType.SELECTOR_START);
    }

    //@return boolean
    isSelectorEnd() {
        return (this.type() === NodeType.SELECTOR_END);
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