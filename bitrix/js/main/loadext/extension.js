;(function() {
    "use strict";
    if ((!BX || !!BX && typeof BX.namespace !== "function") || (!!BX && !!BX.LoadExt && !!BX.LoadExt.Extension)) {
        return;
    }
    BX.namespace("BX.LoadExt");
    var STATE_SCHEDULED = "scheduled";
    var STATE_LOADED = "loaded";
    var STATE_LOAD = "load";
    var STATE_ERROR = "error";
    function inlineScriptsReducer(accumulator, item) {
        return (item.isInternal && accumulator.push(item.JS)),
        accumulator;
    }
    function externalScriptsReducer(accumulator, item) {
        return (!item.isInternal && accumulator.push(item.JS)),
        accumulator;
    }
    function prepareResult(html) {
        return BX.type.isString(html) ? BX.processHTML(html) : {
            SCRIPT: [],
            STYLE: []
        };
    }
    function makeIterable(value) {
        if (BX.type.isArray(value)) {
            return value;
        }
        if (BX.type.isString(value)) {
            return [value];
        }
        return [];
    }
    function loadAll(items) {
        items = makeIterable(items);
        if (!items.length) {
            return Promise.resolve();
        }
        return new Promise(function(resolve) {
            BX.load(items, resolve);
        }
        .bind(this))
    }
    BX.LoadExt.Extension = function(data) {
        if (!BX.type.isPlainObject(data)) {
            return new TypeError("data is not object");
        }
        this.name = data.extension;
        this.state = data.html ? STATE_SCHEDULED : STATE_ERROR;
        var result = prepareResult(data.html);
        this.inlineScripts = result.SCRIPT.reduce(inlineScriptsReducer, []);
        this.externalScripts = result.SCRIPT.reduce(externalScriptsReducer, []);
        this.externalStyles = result.STYLE;
    }
    ;
    BX.LoadExt.Extension.prototype = {
        load: function() {
            if (this.state === STATE_ERROR) {
                this.loadPromise = this.loadPromise || Promise.resolve(this);
                console.warn("Extension", this.name, "not found");
            }
            if (!this.loadPromise && this.state) {
                this.state = STATE_LOAD;
                this.inlineScripts.forEach(BX.evalGlobal);
                this.loadPromise = Promise.all([loadAll(this.externalScripts), loadAll(this.externalStyles)]).then(function() {
                    this.state = STATE_LOADED;
                    return this;
                }
                .bind(this));
            }
            return this.loadPromise;
        }
    }
}
)();
