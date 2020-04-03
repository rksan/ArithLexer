import Factory from './arith-decimal-factory.js';

export default class {
    //class ArithmeticOperator

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
            let operand = arguments[i];

            if (Array.isArray(operand)) {
                ary = operand.slice(0);
            } else {
                ary = operand.number();
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

    _maxDigit(left, right) {
        let digit0 = left.digit();
        let digit1 = right.digit();

        if (digit0 < digit1) {
            return digit1;
        } else {
            return digit0;
        }
    }

    _createDecimal(chars, fmt) {
        let dec = Factory.createDecimal(chars);

        if (fmt !== undefined) {
            dec.format(fmt);
        }

        return dec;
    }

    //@param chars: number chars
    //[@param chars1: as decimal]
    //@return Decimal
    _createOperand(chars) {
        if (arguments[1] === undefined) {
            return this._createDecimal(chars);

        } else {
            let fmt = Factory.getDecimalFormat();
            let buffer = chars.concat(fmt.DOT, arguments[1]);
            return this._createDecimal(buffer, fmt);

        }
    }

    //@param left : chars or Decimal
    //@param right : chars or Decimal
    _createOperator(left, right) {
        return Factory.createOperator(left, right);
    }


    //@param left : left operand
    //@param right : right operand
    //@param mode : 'integer' mode, or 'decimal' mode.
    //@param from : from 'first' or from 'last'
    _createIterator(left, right, mode, from) {
        //set up iterator

        let chars = [left.abs(), right.abs()];

        //Remember that either is a negative number
        let signs = [left.hasSign(), right.hasSign()];

        let digit = this._maxDigit(left, right);

        let ite = new _LikeIterator(chars, signs, digit, mode, from);

        return ite;
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
            //let maxDigit = this.maxDigit(left, right);
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
                let x = Number(oper.left); //One character in the left operand
                let y = Number(oper.right); //One character in the right operand
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
                    //The value on the left side is always larger than the value on the right side.
                    //(replaced in advance)
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



class _OperatorParam {
    static CALCULATION_MODE_INTEGER = 'Integer';
    static CALCULATION_MODE_DECIMAL = 'decimal';
}

class _Operator {

    #left;
    #right;

    constructor(left, right) {
        this.#left = left;
        this.#right = right;
    }

    left() {
        return this.#left;
    }

    right() {
        return this.#right;
    }

    //@param left : ArithmeticDecimal
    //@param right : ArithmeticDecimal
    _maxDigit(left, right) {
        let digit0 = left.digit();
        let digit1 = right.digit();

        if (digit0 < digit1) {
            return digit1;
        } else {
            return digit0;
        }
    }

    //@param chars: char array
    //@param format : ArithmeticDecimalFormat
    _createDecimal(chars, format) {
        let dec = Factory.createDecimal(chars);

        if (format !== undefined) {
            dec.format(format);
        }

        return dec;
    }

    //@param chars: number chars
    //[@param chars1: as decimal]
    //@return Decimal
    _createOperand(chars) {
        if (arguments[1] === undefined) {
            return this._createDecimal(chars);
        } else {
            let format = Factory.getDecimalFormat();
            let chars1 = arguments[1];
            let buffer = chars.concat(format.DOT, chars1);
            return this._createDecimal(buffer, format);
        }
    }

    //@param left : chars or Decimal
    //@param right : chars or Decimal
    _createOperator(left, right) {
        return Factory.createOperator(left, right);
    }


    //@param left : left operand
    //@param right : right operand
    //@param mode : 'integer' mode, or 'decimal' mode.
    //@param from : from 'first' or from 'last'
    _createIterator(left, right, mode, from) {
        //set up iterator

        let chars = [left.abs(), right.abs()];

        //Remember that either is a negative number
        let signs = [left.hasSign(), right.hasSign()];

        let digit = this._maxDigit(left, right);

        let ite = new _LikeIterator(chars, signs, digit, mode, from);

        return ite;
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

}

class _OperatorPlus extends _Operator {

    calculate() {

    }

    _do_Integer() {

    }

    _do_decimal() {

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
            //let maxDigit = this.maxDigit(left, right);
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
                let x = Number(oper.left); //One character in the left operand
                let y = Number(oper.right); //One character in the right operand
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
                    //The value on the left side is always larger than the value on the right side.
                    //(replaced in advance)
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
}

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
class _LikeIterator {

    //@param chars : [chars, chars]
    //@param signs : [bool, bool]
    //@param digit : number
    //@param mode : 'integer' mode, or 'decimal' mode.
    //@param from : from 'first' or from 'last'
    constructor(chars, signs, digit, mode, from) {
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

    //@return {
    //    left: string,
    //    right: string
    //}
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