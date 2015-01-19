"use strict";

var request = require("supertest");
var koa = require("koa");
var enrouten = require("..");
var path = require("path");
var Router = require("siren-router");
var should = require("should");


describe("enrouten", function () {

    run("root", "", function (app, options) {

        app.env = "test";
        app.use(enrouten(app, options));
    });

    run("mountpoint", "/foo", function (app, options) {

        app.env = "test";
        if (!app.mount) {
            app.use(Router(app));
        }

        if (options) {
            options.mountpath = "/foo";
        }
        app.mount("/foo", enrouten(app, options));
    });
});


function get(app, path, next) {

    return request(app.listen())
        .get(path)
        .expect("Content-Type", /text/)
        .expect(200, "ok", next);
}


function getFail(app, path, status, next) {

    return request(app.listen())
        .get(path)
        .expect(status, next);
}


function doneIfError(done) {

    return function (err) {

        err && done(err);
    };
}


function run(name, mount, fn) {

    describe(name + " mounting", function () {

        it("should generate middleware", function() {
                
            var app = koa();
            
            fn(app);
            fn(app, { basedir: path.join(__dirname, "fixtures") });
            fn(app, { directory: null });
            fn(app, { index: null });
            fn(app, { routes: null });
            fn(app, { routes: [] });

            if (mount) {
                app.router.routes.length.should.equal(6);
            } else {
                app.middleware.length.should.equal(6);
            }
        });

        describe("directory", function () {

            it("should return relative path middleware", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "flat")
                });

                get(app, mount + "/controller", done);
            });

            it("should return absolute path middleware", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join(__dirname, "fixtures", "flat")
                });

                get(app, mount + "/controller", done);
            });

            it("should return nested middleware", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "nested")
                });

                get(app, mount + "/controller", doneIfError(done));
                get(app, mount + "/subdirectory/subcontroller", doneIfError(done));
                get(app, mount + "/subdirectory/subsubdirectory/subsubcontroller", done);
            });

            it("should handle case sensitive", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "caseSensitive"),
                    routerOptions: {
                        caseSensitive: true
                    }
                });

                get(app, mount + "/caseSensitive", doneIfError(done));
                getFail(app, mount + "/casesensitive", 404, doneIfError(done));
                get(app, mount + "/lowercase", doneIfError(done));
                getFail(app, mount + "/LOWERCASE", 404, doneIfError(done));
                get(app, mount + "/UPPERCASE", doneIfError(done));
                getFail(app, mount + "/uppercase", 404, done);
            });

            it("should handle strict mode", function (done) {

                var app = koa();
                fn(app, {
                    index: path.join("fixtures", "strict"),
                    routerOptions: {
                        strict: true
                    }
                });

                get(app, mount + "/", doneIfError(done));
                get(app, mount + "/strict", doneIfError(done));
                getFail(app, mount + "/strict/", 404, doneIfError(done));
                get(app, mount + "/very-strict/", doneIfError(done));
                getFail(app, mount + "/very-strict", 404, done);
            });

            it("should throw errors for missing path", function () {

                var app = koa();
                (function () {

                    fn(app, {
                        directory: path.join("fixtures", "undefined")
                    });
                }).should.throw();
            });

            it("should not load invalid route", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "superfluous")
                });

                get(app, mount + "/controller", doneIfError(done));
                get(app, mount + "/subsuperfluous/subcontroller", doneIfError(done));
                getFail(app, mount + "/subsuperfluous/altdefinition", 404, done);
            });

            it("should register named route", function (done) {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "named", "routes")
                });

                should.exist(app.context.enrouten);
                app.context.enrouten.url.should.be.a.Function;
                app.context.enrouten.mountpath.should.equal(mount);
                app.context.enrouten.routes["my-foo"].should.equal("/");
                app.context.enrouten.routes["my-bar"].should.equal("/bar");
                app.context.enrouten.routes["my-list"].should.equal("/list/stuff");

                get(app, mount + "/", doneIfError(done));
                get(app, mount + "/list", doneIfError(done));
                get(app, mount + "/list/stuff", done);
            });

            it("should throw error when meet dulpcated names", function () {

                var app = koa();
                (function () {

                    fn(app, {
                        directory: path.join("fixtures", "named", "dulpcates")
                    });
                }).should.throw();
            });

            it("should generate parameterized url", function () {

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "named", "params")
                });

                app.context.enrouten.url("my-foo", {
                    id: "abc"
                }).should.equal(mount + "/abc");

                app.context.enrouten.url("my-bar", "abc", "efg")
                .should.equal(mount + "/bar/abc/efg");
            });

            it("should ignore dot directories", function () {

                var app = koa();
                (function () {

                    fn(app, {
                        directory: path.join("fixtures", "dotdirectory")
                    });
                }).should.not.throw();
            });

            it("should handle custom extensions", function (done) {

                require.extensions[".customscript"] = require.extensions[".js"];

                var app = koa();
                fn(app, {
                    directory: path.join("fixtures", "customext")
                });

                get(app, mount + "/controller", doneIfError(done));
                get(app, mount + "/customcontroller", function (err) {

                    delete require.extensions[".customscript"];
                    if (err) {
                        return done(err);
                    }

                    done();
                });
            });
        });

        describe("index", function () {

            it("should load index", function (done) {

                var app = koa();
                fn(app, {
                    index: path.join("fixtures", "indexed")
                });

                get(app, mount + "/", doneIfError(done));
                get(app, mount + "/good", doneIfError(done));
                get(app, mount + "/subgood", done);
            });

            it("should load explicit index file", function (done) {

                var app = koa();
                fn(app, {
                    index: path.join("fixtures", "indexed", "index")
                });

                get(app, mount + "/", doneIfError(done));
                get(app, mount + "/good", doneIfError(done));
                get(app, mount + "/subgood", done);
            });

            it("should throw error when missing index file", function () {

                var app = koa();
                (function () {
                    fn(app, {
                        index: path.join("fixtures", "indexed", "undefined")
                    });
                }).should.throw();
            });

            it("should register named route", function (done) {

                var app = koa();
                fn(app, {
                    index: path.join("fixtures", "named", "routes")
                });

                should.exist(app.context.enrouten);
                app.context.enrouten.url.should.be.a.Function;
                app.context.enrouten.mountpath.should.equal(mount);
                app.context.enrouten.routes["my-foo"].should.equal("/");
                app.context.enrouten.routes["my-bar"].should.equal("/bar");

                get(app, mount + "/", doneIfError(done));
                get(app, mount + "/bar", done);
            });

            it("should throw error when meet dulpcated names", function () {

                var app = koa();
                (function () {

                    fn(app, {
                        index: path.join("fixtures", "named", "dulpcates")
                    });
                }).should.throw();
            });

            it("should generate parameterized url", function () {

                var app = koa();
                fn(app, {
                    index: path.join("fixtures", "named", "params")
                });

                app.context.enrouten.url("my-foo", {
                    id: "abc"
                }).should.equal(mount + "/abc");

                app.context.enrouten.url("my-bar", "abc", "efg")
                .should.equal(mount + "/bar/abc/efg");
            });
        });

        describe("routes", function () {

            it("should load routes", function (done) {

                var app = koa();
                fn(app, {
                    routes: [
                        {
                            path: "/",
                            method: "get",
                            handler: function *() {
                                this.body = "ok";
                            }
                        },

                        {
                            path: "/sub",
                            methid: "get",
                            handler: function *() {
                                this.body = "ok";
                            }
                        }
                    ]
                });

                get(app, mount, doneIfError(done));
                get(app, mount + "/sub", done);
            });

            it("should set method default to GET if no methods", function (done) {

                var app = koa();
                fn(app, {
                    routes: [
                        {
                            path: "/",
                            handler: function *() {
                                this.body = "ok";
                            }
                        },

                        {
                            path: "/sub",
                            handler: function *() {
                                this.body = "ok";
                            }
                        }
                    ]
                });

                get(app, mount, doneIfError(done));
                get(app, mount + "/sub", done);
            });

            it("should support multiple verbs", function (done) {

                var app = koa();
                fn(app, {
                    routes: [
                        {
                            path: "/",
                            method: "get",
                            handler: function *() {
                                this.body = "ok";
                            }
                        },

                        {
                            path: "/sub",
                            method: "post",
                            handler: function *() {
                                this.body = "ok";
                            }
                        }
                    ]
                });

                get(app, mount, doneIfError(done));
                request(app.listen())
                .post(mount + "/sub")
                .expect(200, "ok", done);
            });

            it("should throw error when missing handlers", function () {

                var app = koa();
                (function () {
                    fn(app, {
                        routes: [
                            {
                                path: "/",
                                method: "get"
                            }
                        ]
                    });
                }).should.throw();
            });

            it("should throw error when missing paths", function () {

                var app = koa();
                (function () {
                    fn(app, {
                        routes: [
                            {
                                method: "get",
                                handler: function *() {}
                            }
                        ]
                    });
                }).should.throw();
            });

            describe("middleware", function () {

                it("should register single middleware before handler", function (done) {

                    var app = koa();
                    fn(app, {
                        routes: [
                            {
                                path: "/",
                                method: "get",
                                middleware: [
                                    function *(next) {
                                        this.state.value = "Hello";
                                        yield *next;
                                    }
                                ],
                                handler: function *() {
                                    this.body = this.state.value;
                                }
                            }
                        ]
                    });

                    request(app.listen())
                    .get(mount)
                    .expect(200, "Hello", done);
                });

                it("should register multiple middleware before handler", function (done) {

                    var app = koa();
                    fn(app, {
                        routes: [
                            {
                                path: "/",
                                method: "get",
                                middleware: [
                                    function *(next) {
                                        this.state.value = "Hello";
                                        yield *next;
                                    },
                                    function *(next) {
                                        this.state.value = this.state.value + "Hello2";
                                        yield *next;
                                    }
                                ],
                                handler: function *() {
                                    this.body = this.state.value;
                                }
                            }
                        ]
                    });

                    request(app.listen())
                    .get(mount)
                    .expect(200, "HelloHello2", done);
                });

                it("should throw error when middleware error", function (done) {

                    var app = koa();
                    fn(app, {
                        routes: [
                            {
                                path: "/",
                                method: "get",
                                middleware: [
                                    function *(next) {
                                        var error = new Error("middleware error");
                                        error.status = 500;
                                        error.expose = true;
                                        throw error;
                                    }
                                ],
                                handler: function *() {
                                    this.body = "You won't get here";
                                }
                            }
                        ]
                    });

                    request(app.listen())
                    .get(mount)
                    .expect(500, "middleware error", done);
                });
            });
        });

        describe("generated url", function () {

            it("should return generated url", function () {

                var app = koa();

                should.not.exist(enrouten.url(app, "the-bar", {id: 10}));

                fn(app, {
                    directory: path.join("fixtures", "named", "routes")
                });

                var actual = enrouten.url(app, "the-bar", {id: 10});
                should.exist(actual);
                actual.should.equal(mount + "/bar/10");

                actual = enrouten.url(app, "my-bar");
                actual.should.equal(mount + "/bar");

                should.not.exist(enrouten.url(app, "unknown"));
            });

            it("can access in context", function () {

                var app = koa();

                should.not.exist(app.context.enrouten);

                fn(app, {
                    directory: path.join("fixtures", "named", "routes")
                });

                var actual = app.context.enrouten.url("the-bar", {id: 10});
                should.exist(actual);
                actual.should.equal(mount + "/bar/10");

                actual = app.context.enrouten.url("my-bar");
                actual.should.equal(mount + "/bar");

                should.not.exist(app.context.enrouten.url("unknown"));
            });
        });
    });
}