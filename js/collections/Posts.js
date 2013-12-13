/**
 * Posts list
 */

define(
    ['backbone', 'models/Post'],
    function (Backbone, Post) {
    'use strict';

    return Backbone.Collection.extend({
        model: Post,
        num: 10,
        posts_type: 'all',

        url: function () {
            return '/api/activity/posts/?num=' + this.num + '&type=' + this.posts_type;
        },

        initialize: function(options) {
            this.options = this.options || options || {};
        },

        getMore: function (callback) {
            if (this.length == 0) return false;

            var url = this.url() + '&ldate=' + (+this.last().get('native_date') / 1000);
            var new_collection = new (Backbone.Collection.extend({model: Post}))();
            var collection = this;

            new_collection.fetch({
                url: url,
                success: function (col) {
                    if (callback) callback();

                    col.each(function(item) {
                        item.collection = collection;
                    });

                    collection.add(col.models);
                    collection.trigger('reset', new_collection);
                },
                data: this.options.data
            });
        }
    });

});