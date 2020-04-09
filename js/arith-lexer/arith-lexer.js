import Factory from './arith-lexer-factory.js';

export default class{
    #self;

    constructor(syntax) {
        this.#self = new ArithmeticLexer(syntax);
    };

    parse(){
        return this.#self.parse();
    }
}

class ArithmeticLexer {
    //@members
    #syntax; //string
    #syntaxTree; //syntax tree object

    constructor(syntax) {
        this.#syntax = syntax;
    };

    parse() {
        var syntaxTree = this.#syntaxTree;

        if (!syntaxTree) {
            var tokenizer = Factory.createTokenizer(this.#syntax);
            syntaxTree = Factory.createSyntaxTree(tokenizer);
            this.#syntaxTree = syntaxTree;
        }

        return syntaxTree;
    }

};