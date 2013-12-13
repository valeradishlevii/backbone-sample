/**
 * Application layout
 */

define(
    ['marionette', 'vent', 'views/Sidebar', 'views/Navbar', 'views/common/HotRegion', 'views/instruments/OpenTradePopup', 'views/instruments/CloseTradePopup','views/common/PopupMessage', 'views/posts/Add', 'views/instruments/EditTradePopup',
        'behavior'],
    function (Marionette, vent, SidebarView, Navbar, HotRegion, OpenTradePopup, CloseTradePopup, PopupMessage, AddPostView, EditTradePopup) {

        var _pad  = function(n){return n<10 ? '0'+n : n;};

        var setCurrentTime = function (){
            var d = new Date();
            $('.current-time').text(
                _pad(d.getUTCHours()) + ':' +
                _pad(d.getUTCMinutes()) + ':' +
                _pad(d.getUTCSeconds()) + ' UTC'
            );
            setTimeout(setCurrentTime, 1000);
        };

        return Marionette.Layout.extend({
            template: "layout",

            regions: {
                menu: "#menu",
                content: "#content",
                sidebar: "#sidebar",
                navbar: "#navbar",
                hot_now: HotRegion,
                popup: ".popup",
                instrument_dlg: '.instrument-dlg-wrapper',
                top_trades: '#top-trades',
                add_post: ".add-post-wrapper"
            },

            events: {
                'submit .navbar-search': 'onSearch',
                'click #fund_your_account_btn': 'deposit_fund'
            },
            deposit_fund: function(ev){
                $('#fund_your_account_frame').attr('src', 'about:blank');
                $('#fund_your_account_frame').attr('src', '/payments/safecharge/temp_fund/');
                $('#fund_your_account').modal({show: true, backdrop: 'static', keyboard: false});
                $('#fund_your_account>div').resizable({'minHeight':'590','minWidth':'1080'});
                ev.preventDefault(true);
                ev.stopPropagation(true);
                return false;
            },

            onSearch: function(e){
                Backbone.history.navigate('/search/'+$('.search-query').val(), {trigger: true});

                e.preventDefault(false);
                e.stopPropagation(false);
                return false;
            },

            onRender: function () {
                this.navbar.show(new Navbar());
                this.sidebar.show(new SidebarView());
                this.add_post.show(new AddPostView());

                vent.on('layout:media:show', function() {
                    this.$el.find('.promo').removeClass('hide');
                    this.$el.find('.main-content-area')
                            .addClass('col-md-9').addClass('col-lg-9')
                            .removeClass('col-md-12').removeClass('col-lg-12');
                }, this);

                vent.on('layout:media:hide', function() {
                    this.$el.find('.promo').addClass('hide');
                    this.$el.find('.main-content-area')
                            .removeClass('col-md-9').removeClass('col-lg-9')
                            .addClass('col-md-12').addClass('col-lg-12');
                }, this);

                vent.on('open_trade:show',
                    function (instrument, direction, defaults) {
                        if (!instrument)return;
                        console.log('open new trade modal window');
                        this.instrument_dlg.show(new OpenTradePopup({model: instrument, direction: direction, layout: this, defaults: defaults}));
                    }, this);

                vent.on('close_trade:show',
                    function (instrument) {
                        if (!instrument)return;
                        console.log('open close trade modal window');
                        this.instrument_dlg.show(new CloseTradePopup({model: instrument, layout: this}));
                    }, this);

                vent.on('edit_trade:show',
                    function (position) {
                        if (!position)return;
                        console.log('open edit trade modal window');
                        this.instrument_dlg.show(new EditTradePopup({model: position, layout: this}));
                    }, this);

                vent.on('new_popup_message', function (message) {
                    this.popup.show(new PopupMessage({message: message, layout: this}));
                }, this);

                $(function(){
                    setCurrentTime();
                });
            }
        });
    }
);