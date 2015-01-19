"use strict";

var fs = require("fs");
var path = require("path");
var Router = require("siren-router");
var debug = require("debuglog")("siren/enrouten/directory");


module.exports = function directory(router, register, basedir, options) {
    var handler;
    handler = createFileHandler(router, register, options);
    traverse(basedir, "", "", handler);
    return router;
};


/**
 * Traverses the provided basedir, invoking the provided function when a file
 * is encountered.
 * @param basedir the root directory where the traversal should begin
 * @param ancesors the relative path from the basedir to the current dir
 * @param current the current directory name
 * @param fn the function to invoke when a file is encountered: `function (basedir, ancestors, current)`
 */
function traverse(basedir, ancestors, current, fn) {
    var abs, stat;

    // don't do anything with dot files/directories
    if (current.charAt(0) === ".") {
      return;
    }

    abs = path.join(basedir, ancestors, current);
    stat = fs.statSync(abs);

    if (stat.isDirectory()) {
        ancestors = ancestors ? path.join(ancestors, current) : current;
        fs.readdirSync(abs).forEach(function (child) {
            traverse(basedir, ancestors, child, fn);
        });
    }

    if (stat.isFile()) {
        fn(basedir, ancestors, current);
    }
}


/**
 * Factory function that produces a fn implementation to
 * provide to the directory handler. Filters file/module
 * for the desired API `function(router)`, determines mount
 * point and mounts the router.
 * @param router the Router against which child routers are mounted
 * @param options the options object to pass to each Router created
 * @returns {Function} the implementation function to provide to directory
 */
function createFileHandler(router, register, options) {

    return function handler(basedir, ancestors, current) {

        var abs, impl, filename, mountpath, subrouter, prefix;

        abs = path.join(basedir, ancestors, current);
        filename = path.basename(current, path.extname(current));

        if (hasRequireHandler(abs)) {
            impl = require(abs);

            if (typeof impl === "function" && impl.length === 1) {
                // Build current pount path, ignoring `index` in lieu of `/`
                mountpath = ancestors ? ancestors.split(path.sep) : [];
                filename !== "index" && mountpath.push(filename);
                mountpath = "/" + mountpath.join("/");

                debug("mounting", current, "at", mountpath);
                subrouter = new Router(options);
                impl(subrouter);
                router.mount(mountpath, subrouter.middleware());

                prefix = mountpath.slice(-1) === "/" ? mountpath.slice(0, -1) : mountpath;
                subrouter.routes.forEach(function (route) {

                    if (route.name) {
                        register(route.name, prefix + route.path);
                    }
                });
            }
        }
    };
}


/**
 * Returns true if `require` is has a handler for this type
 * of file.
 * http://nodejs.org/api/modules.html#modules_file_modules
 * @param file the file for which to determine handlerable-ness.
 * @returns {boolean}
 */
function hasRequireHandler(file) {

    return !!~Object.keys(require.extensions).indexOf(path.extname(file));
}
