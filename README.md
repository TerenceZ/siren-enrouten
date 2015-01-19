siren-enrouten
==========

A Route configuration middleware for [koa]((https://github.com/koajs/koa)

=======
[![Build Status](https://travis-ci.org/TerenceZ/siren-enrouten.png)](https://travis-ci.org/TerenceZ/siren-enrouten)   

### Usage
```javascript
var koa = require('koa'),
    enrouten = require('siren-enrouten');

var app = koa();
app.use(enrouten(app));
```

### Configuration
Please refer to [express-enrouten](https://github.com/krakenjs/express-enrouten), except that all middleware should be generators.

### Note
If you want to mount the enrouten using middleware like [koa-mount](https://github.com/koajs/mount), you SHOULD set the `mountpath` for enrouten, for example:
```javascript
var app = require('koa'),
    mount = require('koa-mount'),
    enrouten = require('siren-enrouten');

var app = koa();
app.use(mount('/foo', enrouten(app, { mountpath: '/foo' })));
```
Otherwise, when you use `enrouten.url`, it will return an unmounted url.

#### routerOptions
The `routerOptions` configuration option (optional) allows additional options to be
specified on each Router instance created by `siren-enrouten`. Please refer to [siren-router](https://github.com/TerenceZ/siren-router).

```javascript
app.use(enrouten(app, {
    directory: 'controllers',
    routerOptions: {
        caseSensitive: true
    }
}));
```

### Named Routes
For `index` and `directory` configurations there is also support for named routes.
When you use named routes by the passed siren-router instance, enrouten will fetch
the named routes out and you can get the named url by `ctx.enrouten.url` or `enrouten.url`.
For example:

```javascript
var enrouten = require('siren-enrouten');
app.use(enrouten(app));
```

```javascript
var enrouten = require('siren-enrouten');

module.exports = function (router) {

    router.get('my-foo', '/foo/:id', function *(next) {
        // ...
    });

    router.get('/my-foo2', '/foo2/:id', function *() {
        this.redirect(this.enrouten.url('my-foo', this.params.id));
        // or this.redirect(enrouten.url(this.app, 'my-foo', this.params.id));
    });
};
```

### Controller Files
Please refer to [express-enrouten](https://github.com/krakenjs/express-enrouten), except that all middleware should be generators.

## Tests
```bash
$ npm test
```

## Coverage
```bash
$ npm run-script test-cov && open coverage/lcov-report/index.html
```
