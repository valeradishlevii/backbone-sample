/**
 * Start application
 */

define(
    [
        'marionette',
        'vent',
        'views/Layout',
        'models/User',
        'models/Instrument',
        'sockets',
        'behavior',
        'bootstrap',
        'jqueryui',
        'tpl'
    ],
    function (Marionette, vent, Layout, User, Instrument, sockets, behavior) {
        "use strict";

        var app = new Marionette.Application(preloaded_data.app_options);

        app.setTitle = function(text) {
            return document.title = text ? text + ' - ' + this.base_title : this.base_title;
        };

        // Convert plain preloaded user object to backbone model
        preloaded_data.current_user = new User(preloaded_data.user, {parse: true});

        app.addRegions({
            app: '#app'
        });

        app.layout = new Layout();

        app.app.show(app.layout);

        app.on('initialize:after', function () {
            // Enable history and navigation hack
            Backbone.history.start({ pushState: true });
            $(document).on("click", 'a[role="nav"]', function (e) {
                Backbone.history.navigate($(this).attr('href'), {trigger: true});
                e.preventDefault();
            });
            behavior();
        });

        Backbone.history.on('route', function () {
            window.scrollTo(0, 0); // Scroll to top of page on navigation
        });

        /**
         * Instruments price updates
         */
        sockets.instruments_price.on('message', function(data) {
            _.each(data, function(prices, symbol) {
                var instrument = Instrument.findOrCreate({url_slug: symbol});
                var old_prices = instrument.get('price');
                instrument.set({
                    old_price: old_prices,
                    price: prices
                }, {silent: true});

                if((old_prices.sell != prices.sell) || (old_prices.buy != prices.buy)){
                    instrument.trigger('price_changed', instrument, prices);
                }
            });
        });

        sockets.current_user.on('message', function(data) {
            data = _.isObject(data) ? data : JSON.parse(data);

            if(!data.avatar) {
                data.avatar = User.prototype.defAvatar;
            }
            preloaded_data.current_user.set(data);
        });

        vent.on('chart_frame:show',
            function(id){
                if(id){
                    $('#chartModal iframe').attr('src', '/activity/symbol/_iframe/?symbol='+id);
                    $('#chartModal').modal('show');
                }
            });


        return app;

    }
);
