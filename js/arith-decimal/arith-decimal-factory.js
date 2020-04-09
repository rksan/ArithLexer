import DecimalFormat from './arith-decimal-format.js';
import Decimal from './arith-decimal.js';
import Operator from './arith-operator.js';

export default class {
    //class ArithmeticDecimalFactory

    static createOperator(left, right){
        return new Operator(left, right);
    }

    static createDecimal(chars) {
        return new Decimal(chars);
    }

    static getDecimalFormat() {
        return DecimalFormat;
    }
}