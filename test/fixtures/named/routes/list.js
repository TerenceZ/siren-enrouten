"use strict";

module.exports = function (router) {

    router.get("/", function *(next) {
        this.body = 'ok';
    });



    router.get("my-list", "/stuff", function *(next) {
        this.body = 'ok';
    });
};
