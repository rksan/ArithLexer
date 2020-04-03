import Lexer from './arith-lexer.js';
import SyntaxTree from './arith-syntax-tree.js';
import SyntaxNode from './arith-node.js';
import Factory from '/ArighTokenizer/js/arith-tokenizer/arigh-tokenizer-factory.js';

//factory class

export default class {
    //class ArithmeticLexerFactory

    //@param syntax : string
    //@return parser : new instance
    static createLexer(syntax) {
        return new Lexer(syntax, this);
    }

    //@param tokenizer: Tokenizer object
    //@return SyntaxTree : new instance
    static createSyntaxTree(tokenizer) {
        return new SyntaxTree(tokenizer);
    }

    //@param token : Token object
    //@param type : string of node type
    //@return SyntaxNode : new instance
    static createSyntaxNode(token, type){
        return new SyntaxNode(token, type);
    }

    //@return syntax : string
    //@return Tokenizer : new instance
    static createTokenizer(syntax) {
        return Factory.createTokenizer(syntax);
    }

};