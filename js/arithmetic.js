import DecimalFactory from './arith-decimal/arith-decimal-factory.js';
import LexerFactory from './arith-lexer/arith-lexer-factory.js';

export default class {
    //class Arithmetic

    //@param syntax: string of 'infix notation'
    //@return Node : abstract syntax tree object.
    static parseTree(syntax) {
        let tree;

        if (typeof syntax === 'string') {
            let lexer = LexerFactory.createLexer(syntax);
            let syntaxTree = lexer.parse();
            tree = syntaxTree.tree();
        } else {
            tree = syntax;
        }

        return tree;
    }

    //@param syntax : infix notation.
    //@return string : infix notation.
    static infix(syntax) {
        let tree = this.parseTree(syntax);

        return tree.infix();
    }

    //@param syntax : infix notation.
    //@return string : prefix notation.
    static prefix(syntax) {
        let tree = this.parseTree(syntax);

        return tree.prefix();
    }

    //@param syntax : infix notation.
    //@return string : postfix notation.
    static postfix(syntax) {
        let tree = this.parseTree(syntax);

        return tree.postfix();
    }

    //@param syntax : infix notation.
    //@return number : result
    static calc(syntax) {

        //@param node : {node object}
        //@return number
        let _do = (node) => {
            let chars = _do_chars(node);
            return Number(chars.toString());
        };

        //@param node : {node object}
        //@return chars
        let _do_chars = (node) => {
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
                let ope = DecimalFactory.createOperator(chars0, chars1);

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

                    result = _do_chars(left);
                }

                return result;
            } else {
                return 0;
            }
        };

        let tree = this.parseTree(syntax);

        let result = _do(tree);

        return result;

    }
};
