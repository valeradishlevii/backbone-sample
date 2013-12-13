define(
    ['marionette', 'controllers/stream'],
    function (Marionette, Controller) {
        'use strict';

        return Marionette.AppRouter.extend({
            appRoutes: {
                '': 'userStream'
            },
            controller: new Controller()
        });
    });
