"use strict";

module.exports = function (router) {

    router.get("my-foo", "/", function *(next) {
        this.body = 'ok';
    });

    router.get("my-bar", "/bar", function *(next) {
        this.body = 'ok';
    });

    router.get("the-bar", "/bar/:id", function *(next) {
        this.body = 'ok';
    });
};
