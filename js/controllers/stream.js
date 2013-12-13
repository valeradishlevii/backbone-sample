/**
 * Stream controller
 */

define(['vent', 'app', 'models/Stream', 'collections/UserStream', 'views/stream/UserStream', 'views/TopTrades', 'views/sidebar/MyMiniProfile'],
    function (vent, app, Stream, UserStream, UserStreamView, TopTrades, MyMiniProfile) {
        "use strict";

        return Marionette.Controller.extend({
            userStream: function () {
                console.log('entered userStream');

                app.setTitle('Dashboard');

                // Receive collection
                this.collection = new UserStream();
                var userStreamView = new UserStreamView({
                    collection: this.collection
                });
                app.layout.content.show(userStreamView);

                // if(!this.top_trades){
                    this.top_trades = new TopTrades();
                    app.layout.top_trades.show(this.top_trades);
                // }
                userStreamView.on('close', function() {
                    app.layout.top_trades.close();
                });

                vent.trigger('sidebar:show_mini_profile', new MyMiniProfile({
                    model: preloaded_data.current_user
                }));

                this.collection.fetch({
                    reset: true
                });

                vent.trigger('layout:media:show');
            }
        });
    });
