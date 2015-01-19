"use strict";

module.exports = function (router) {

    router.get("my-foo", "/foo", function *(next) {
        this.body = 'ok';
    });
};
