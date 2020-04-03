import _DecimalFormat from './arith-decimal-format.js';
import _Decimal from './arith-decimaljs';
import _Operator from './arith-operator.js';

export default class {
    //class ArithmeticDecimalFactory

    static createOperator(left, right){
        return new _Operator(left, right);
    }

    static createDecimal(chars) {
        return new _Decimal(chars);
    }

    static getDecimalFormat() {
        return _DecimalFormat;
    }
}