'use strict';


module.exports = function (router) {

  router.get('/', function *(next) {
    this.body = 'ok';
  });

};
