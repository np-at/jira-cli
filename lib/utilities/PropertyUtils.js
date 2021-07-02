Function.prototype.generateProperty = function (name, options) {
    const privateName = '__';
    options = options || {};
    options.get ?? (options.get = true);
    options.set ?? (options.set = true);
    if (options.defaultValue) {
        this.prototype[privateName] = options.defaultValue;
    }
    const definePropOptions = {}, getterName = '__get_' + name, setterName = '__set_' + name;
    if (true === options.get) {
        this.prototype[getterName] = function () {
            return this[privateName];
        };
    }
    else if (options.get) {
        this.prototype[getterName] = options.get;
    }
    else {
        this.prototype[getterName] = function () {
            throw new Error('Cannot get: ' + name);
        };
    }
    definePropOptions['get'] = function () {
        return this[getterName].call(this);
    };
    if (true === options.set) {
        this.prototype[setterName] = function (val) {
            this[privateName] = val;
        };
    }
    else if (options.set) {
        this.prototype[setterName] = options.set;
    }
    else {
        this.prototype[setterName] = function () {
            throw new Error('Cannot set: ' + name);
        };
    }
    definePropOptions['set'] = function (val) {
        this[setterName].call(this, val);
    };
    Object.defineProperty(this.prototype, name, definePropOptions);
};
