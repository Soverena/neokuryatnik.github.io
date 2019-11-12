;(function() {
    "use strict";
    if ((!BX || !!BX && typeof BX.namespace !== "function") || (!!BX && typeof BX.loadExt === "function")) {
        return;
    }
    BX.namespace("BX");
    var CONTROLLER = "main.bitrix.main.controller.loadext.getextensions";
    var RESPONSE_STATUS_SUCCESS = "success";
    var initialized = {};
    function request(data) {
        return new Promise(function(resolve) {
            BX.ajax.runAction(CONTROLLER, {
                data: data
            }).then(resolve);
        }
        );
    }
    function prepareExtensions(response) {
        if (response.status !== RESPONSE_STATUS_SUCCESS) {
            response.errors.map(console.warn);
            return [];
        }
        return response.data.map(function(item) {
            return (getInitialized(item.extension) || (initialized[item.extension] = new BX.LoadExt.Extension(item)));
        });
    }
    function loadExtensions(extensions) {
        return Promise.all(extensions.map(function(item) {
            return item.load();
        }));
    }
    function getInitialized(extensionName) {
        return initialized[extensionName];
    }
    function isInitialized(extensionName) {
        return extensionName in initialized;
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
    BX.loadExt = function(extension) {
        extension = makeIterable(extension);
        var isAllInitialized = extension.every(isInitialized);
        if (isAllInitialized) {
            var initializedExtensions = extension.map(getInitialized);
            return loadExtensions(initializedExtensions);
        }
        return request({
            extension: extension
        }).then(prepareExtensions).then(loadExtensions);
    }
    ;
}
)();
