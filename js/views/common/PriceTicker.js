define(
    ['marionette'],
    function (Marionette) {
        "use strict";
        var throttledFetch = _.throttle(function() {
            this.model.fetch();
        }, 2500);

        return Marionette.ItemView.extend({
            tagName: 'span',
            template: 'common/price_ticker',

            initialize: function (options) {
                this.model = options.model;

                var sides = {0: 'buy', 1: 'sell'};
                this.price_type = sides[parseInt(options.side)] || options.price_type;

                this.template = options.template || 'common/price_ticker';

                this.additional_anchor_attrs = options.additional_anchor_attrs;
                this.additional_anchor_classes = options.additional_anchor_classes;

                this.listenTo(this.model, 'price_changed', this.render, this);

                this.shevron_styles = ['glyphicon-chevron-down', 'glyphicon-chevron-up'];
                this.arrow_styles = ['glyphicon-arrow-down','glyphicon-arrow-up'];
                this.button_styles = ['btn-danger', 'btn-success'];
            },
            isPriceChanged: function(){
                var old_price = this.model.get('old_price')[this.price_type];
                var price = this.model.get('price')[this.price_type];
                if (old_price != price){
                    return [Number(old_price < price), old_price, price];
                }
                return false;
            },
            onRender: function() {
                setTimeout(_.bind(this.resetStyles,this), 750);
            },
            resetStyles: function(){
                var el = this.$el;
                $('.price_ticker_up', el).removeClass('price_ticker_up');
                $('.price_ticker_down', el).removeClass('price_ticker_down');
                $('i',el).removeClass(this.shevron_styles[0]).removeClass(this.shevron_styles[1])
                    .removeClass(this.arrow_styles[0]).removeClass(this.arrow_styles[1]);
                $('a',el).removeClass(this.button_styles[0]).removeClass(this.button_styles[1]).addClass('btn-info');
            },

            serializeData: function(){
                var price = this.model.get('price')[this.price_type],
                    original_price = parseFloat(price);

                if(this.model.get('asset_class') == 'Currency') {
                    var arr = price.split('');
                    arr[arr.length - 1] = '<sup>' + arr[arr.length - 1] + '</sup>';
                    price = arr.join('');
                }

                if(original_price === 0) {
                    price = '-';
                }
                var old_price = parseFloat(this.model.get('old_price')[this.price_type]);
                if((old_price === 0 && original_price !== 0) || (old_price !== 0 && original_price === 0)) {
                    throttledFetch.apply(this);
                }

                var prices_changed = this.isPriceChanged(),
                    context={
                        common_style_class:'',
                        shevron_style_class:'',
                        arrow_style_class:'',
                        additional_anchor_classes:this.additional_anchor_classes,
                        additional_anchor_attrs:this.additional_anchor_attrs,
                        btn_style_class:'btn-info',
                        price:price,
                        price_type: (this.price_type=='sell'),
                        is_accessible_for_action: this.model.get('is_accessible_for_action'),
                        original_price:original_price
                    };

                if(prices_changed){
                    var dir = prices_changed[0];
                    context.common_style_class = dir ? 'price_ticker_up' : 'price_ticker_down';
                    context.shevron_style_class = this.shevron_styles[dir];
                    context.arrow_style_class = this.arrow_styles[dir];
                    context.btn_style_class = this.button_styles[dir];
                }

                return context;
            }
        });
    });