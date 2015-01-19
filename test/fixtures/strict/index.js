'use strict';

//
//XXX: the trailing slashes in this file are very important,
// if you change them you will likely break some tests
//
module.exports = function (router) {

    router.get('/', function *(next) {
        this.body = 'ok';
    });

    router.get('/strict', function *(next) {
        this.body = 'ok';
    });

    router.get('/very-strict/', function *(next) {
        this.body = 'ok';
    });

};
