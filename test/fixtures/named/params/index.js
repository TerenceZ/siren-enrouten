"use strict";

module.exports = function (router) {

    router.get("my-foo", "/:id", function *(next) {
        this.body = 'ok';
    });

    router.get("my-bar", "/bar/:id/:action", function *(next) {
        this.body = 'ok';
    });
};
