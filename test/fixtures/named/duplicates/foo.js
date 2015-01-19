"use strict";

module.exports = function (router) {

    router.get("my-foo", "/foo2", function *(next) {
        this.body = 'ok';
    });
};
