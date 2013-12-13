/**
 * Hot region view
 */

define(
    ['marionette'],
    function (Marionette) {
        /**
         * Handle relative region closing, because `close` event are called after new view has been displayed
         * If views not equal means that the view are displayed before than `close` will close new view
         * If views are equal means that we leave the same route where event attached
         */
        return Marionette.Region.extend({
            el: '#hot-now',

            relativeClose: function(expectedView) {
                if(this.currentView == expectedView){
                    this.close();
                }
            }
        });
    }
);