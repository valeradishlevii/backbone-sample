/**
 * Init routers in application
 */

// Names in app.routers, order is important
var routers = [
    'instruments',
    'stream',
    'users',
    'search',
    'posts'
];

// Explicit load routers because build does not understand implicit passing
define(
    [
        'routers/instruments',
        'routers/stream',
        'routers/users',
        'routers/search',
        'routers/posts'
    ],
    function () {
        var routerInstances = {};

        for (var i in arguments) {
            if (!arguments.hasOwnProperty(i)) continue;

            var Router = arguments[i];
            routerInstances[routers[i]] = new Router();
        }

        return routerInstances;
    }
);