import Factory from './arith-decimal-factory.js';
import Format from './arith-decimal-format.js';

export default class {
    //class ArithmeticDecimal

    //_mark_sign = '-';
    //_mark_dot = '.';
    //_decimal_max_digit = 16;
    _format = Format;

    _sign = '';
    _naturals = [];
    _decimals = [];

    //constructor(chars, mark_sign, mark_dot) {
    constructor(chars) {
        this._chars = chars || [];
        //this._mark_sign = mark_sign;
        //this._mark_dot = mark_dot;

        //set number
        this.number(chars);
    }

    create(chars) {
        //return new ArithmeticDecimal(chars, this._mark_sign, this._mark_dot);
        return Factory.createDecimal(chars);
    }

    toString() {
        return this.number().join('');
    }

    toNumber() {
        return Number(this.toString());
    }

    format(format) {
        if(arguments.length === 0){
            return this._format;
        }else{
            this._format = format;
        }
        return this;
    }

    markDot() {
        return this._format.DOT;
    }

    markSign() {
        return this._format.SIGN;
    }

    decimalMaxDigit() {
        return this._format.DECIMAL_MAX_DIGIT;
    }

    number(chars) {
        if (arguments.length === 0) {
            //@getter
            let ints = this.integer();
            let decs = this.decimal();

            if (decs.length === 0) {
                return ints;
            } else {
                return [].concat(ints, [this.markDot()], decs);
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
    //@getter
    //    return char array
    //@setter
    //    @param chars : char array
    //    @return this
    natural(chars) {
        if (arguments.length === 0) {
            //@getter
            return this._naturals;
        } else {
            //@setter
            let nats = chars;

            //sign
            if (this._hasSign(nats)) {
                //delete sign
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
    //  @return [ chars ]
    //@setter
    //  @param [ chars ]
    //  @return this
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
            let nums = this._abs(chars);
            return this.number(nums);
        }

    }

    //@return number
    digit() {
        //@getter
        let nats = this.natural();
        let decs = this.decimal();
        return (nats.length + decs.length);
    }

    //@getter
    //    @return string
    //@setter
    //    @param sign: boolean
    //    @return this
    sign(sign) {
        if (arguments.length === 0) {
            //@getter
            return this._sign;
        } else {
            //@setter
            if (sign === true) {
                this._sign = this.markSign();
            } else {
                this._sign = '';
            }

            return this;
        }
    }

    //@return this
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
        }
        //@setter
        this._decimal_max_digit = (typeof digit === 'number' ? digit : Number(digit));
        return this;
    }

    //@return [char array]
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
        return chars.indexOf(this.markSign());
    }

    //@return boolean
    _hasDeimal(chars) {
        return (this._indexOfDecimal(chars) !== -1);
    }

    //@return index
    _indexOfDecimal(chars) {
        return chars.indexOf(this.markDot());
    }

    //@param chars:
    //@return [ integer chars, decimal chars ]
    _sliceOfDecimal(chars) {
        let index = this._indexOfDecimal(chars);
        if (index === -1) {
            return [chars, []];
        } else {
            return [chars.slice(0, index), chars.slice(index + 1)];
        }
    }
};