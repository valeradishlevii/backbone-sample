define(
    ['marionette'],
    function (Marionette) {
        "use strict";

        return Marionette.ItemView.extend({
            tagName: 'a',
            template: 'common/follow_button',

            def_class: 'btn btn-info',

            events: {
                'click .follow-btn': 'toggleFollow'
            },

            initialize: function (options) {
                this.listenTo(this.model, 'sync', function() {
                    this.model.in_change = false;
                }, this);
            },

            toggleFollow: function(e) {
                if(!this.model.in_change) {
                    this.model.toggle_follow();
                    this.model.in_change = true;
                }

                e && e.preventDefault();
            },

            onRender: function() {
                var self = this;
                var is_following = this.model.get('is_following');

                this.$el.attr('data-toggle', 'tooltip');
                this.$el.tooltip();
                this.$el.addClass(this.def_class + (this.options ? ' ' + this.options.css_class : ''));
                this.$el.on('click', function(e) {
                    self.toggleFollow(e);
                });

                if(is_following){
                    var prevText = this.$el.html();
                    if (self.options.short) {
                        this.$el.attr('data-original-title', 'unfollow');
                    }

                    this.$el.hover(function(e) {
                        $(this).removeClass('btn-info')
                               .addClass('btn-danger')
                               .html(self.options.short ? '<i class="glyphicon glyphicon-remove"></i>' : 'unfollow');
                    }, function (e) {
                        $(this).addClass('btn-info')
                               .removeClass('btn-danger')
                               .html(prevText);
                    });
                }
            },

            serializeData: function() {
                var data = this.model.toJSON();

                data.options = {
                    short: this.options.short
                };

                return data;
            }
        });
    });