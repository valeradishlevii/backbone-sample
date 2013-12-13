/**
 * Mixin to adding target="_blank" to each external link in this.$el
 */

define(
    [],
    function () {
        "use strict";

        var clickCb = function (e) {
            if (this.hostname !== window.location.hostname) {
                $(this).attr('target', '_blank');
            }
        };

        return {
            initialize: function() {
                this.on('render', function() {
                    this.$el.off('click', clickCb);
                    this.$el.on('click', 'a', clickCb);
                }, this);
            }
        };
    });
