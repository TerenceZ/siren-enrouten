/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
"use strict";

var path = require("path");
var caller = require("caller");
var Router = require("siren-router");
var index = require("./lib/index");
var routes = require("./lib/routes");
var directory = require("./lib/directory");
var debug = require("debuglog")("siren/enrouten");
var assert = require("assert");


/**
 * Expose module.
 */
module.exports = enrouten;

/**
 * Create a URL from a named route and data.
 * @param app the koa app for which to generate the named route
 * @param name the name of the route to generate
 * @param params the object containing keys and values for the named replacements.
 * @returns {String} the generated URL or undefined if no named route exists.
 */
module.exports.url = function url(app, name, params) {

    var context = app.context;
    if (context.enrouten && typeof context.enrouten.url === "function") {
        return context.enrouten.url(name, params);
    }

    return undefined;
};


/**
 * The main entry point for this module. Creates middleware
 * to be mounted to a parent application.
 * @param app koa application
 * @param options the configuration settings for this middleware instance
 * @returns {Function} koa middleware
 */
function enrouten(app, options) {

    options = options || {};
    options.basedir = options.basedir || path.dirname(caller());

    // allow inherited options to be passed to created Routers
    var routerOptions = options.routerOptions || {};
    var router = new Router(routerOptions);
    var namedRoutes = {};
    var mountpath = (!options.mountpath || options.mountpath === "/") ? "" : options.mountpath;

    if (mountpath.slice(-1) === "/") {
        mountpath = mountpath.slice(0, -1);
    }

    // Register a named path into `namedRoutes`.
    function registerRoute(name, path) {

      path = mountpath + path;
      if (path.length > 1 && path.slice(-1) === "/") {
        path = path.slice(0, -1);
      }

      assert(!namedRoutes.hasOwnProperty(name), "A route already exists for the name '" + name + "'");
      debug("registering name %s for %s", name, path);

      namedRoutes[name] = path;
    }

    // Process the configuration, adding to the middleware
    if (typeof options.index === "string") {
        debug("resolving index", options.index);

        index(router, resolve(options.basedir, options.index));
    }

    if (typeof options.directory === "string") {
        debug("resolving directory", options.directory);

        directory(router, registerRoute, resolve(options.basedir, options.directory), routerOptions);
    }

    if (typeof options.routes === "object") {
        debug("resolving routes");
        
        routes(router, options.routes);
    }

    // Register the named routes generated from `index`.
    router.routes.forEach(function (route) {

      if (route.name) {
        registerRoute(route.name, route.path);
      }
    });

    // Create enrouten context.
    app.context.enrouten = {

        routes: namedRoutes,

        mountpath: mountpath,

        /**
         * Generate URL using given `path` and `params`.
         * @param {String} url
         * @param {Object} params url parameters
         * @return {String}
         */
        url: function url(name, params) {

            var route = this.routes[name];
            if (route) {
              var args = params;

              // Support the (key, value) object form.
              if (typeof params !== "object") {
                args = Array.prototype.slice.call(arguments, 1);
              }

              if (Array.isArray(args)) {
                for (var i = -1, l = args.length; ++i < l;) {
                  route = route.replace(/:[^\/]+/, args[i]);
                }

              } else {
                for (var key in args) {
                  route = route.replace(":" + key, args[key]);
                }
              }

              return route.split("/").map(function (component) {
                return encodeURIComponent(component);
              }).join("/");
            }

            return undefined;
        }
    };

    return router.middleware();
}

/**
 * Resolves the provide basedir and file, returning
 * and absolute file path.
 * @param basedir the base directory to use in path resolution
 * @param file the absolute or relative file path to resolve.
 * @returns {String} the resolved absolute file path.
 */
function resolve(basedir, file) {

    if (path.resolve(file) === file) {
        return file;
    }
    return path.join(basedir, file);
}