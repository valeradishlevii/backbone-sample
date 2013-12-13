define(
    ['marionette'],
    function (Marionette) {
        "use strict";

        return Marionette.ItemView.extend({
            tagName: 'div',
            template: 'common/message',
            initialize: function (options) {
                this.message = options.message;
                this.layout = options.layout;
            },
            serializeData: function(){
                return {message:this.message}
            },
            onRender:function(){
                this.$dlg = $('.popupMessage',this.el)
                this.$dlg.fadeIn();
                setTimeout(_.bind(this.closePopup, this), 2000);
            },
            closePopup:function () {
                this.$dlg.fadeOut('slow');
                this.layout.popup.close();
            },
        });
    });