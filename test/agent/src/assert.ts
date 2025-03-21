function assert(actual: () => any): CallbackAssertion;
function assert<T>(actual: T): ValueAssertion<T>;

function assert<T>(actual: T | (() => any)): T extends () => any ? CallbackAssertion : ValueAssertion<T> {
    return new Assertion(actual) as any;
}

type ValueAssertion<T> = Omit<Assertion<T>, keyof CallbackAssertion>;

type CallbackAssertion = Pick<Assertion<any>, "throws">;

class Assertion<T> {
    constructor(private readonly actual: T | (() => any)) {}

    is(expected: T) {
        if (!eq(expected, this.actual)) {
            throw new AssertionError(`\x1b[1m${expected}\x1b[22m was expected, but got \x1b[1m${this.actual}\x1b[22m`);
        }
    }

    not(unexpected: T) {
        if (eq(unexpected, this.actual)) {
            throw new AssertionError(`\x1b[1m${unexpected}\x1b[22m was not expected`);
        }
    }

    throws(expectedMessage: string) {
        try {
            if (isCallable(this.actual)) {
                this.actual();
            }
            throw new AssertionError("no errors");
        } catch (err: any) {
            assert(err.message.replaceAll(/\x1b\[[^m]+m/g, "")).is(expectedMessage);
        }
    }
}

class AssertionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AssertionError";
    }
}

const ANY: any = {};

function eq(a: any, b: any) {
    return a === ANY || b === ANY
        ? true
        : a instanceof NativePointer || a instanceof NativeStruct
        ? a.equals(b)
        : a instanceof Array || b instanceof Array
        ? JSON.stringify(a) == JSON.stringify(b)
        : a == b;
}

const isCallable = <T>(maybeFunction: T | (() => any)): maybeFunction is () => T => typeof maybeFunction === "function";
