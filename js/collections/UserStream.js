/**
 * User stream
 */

define(
    ['backbone', 'vent', 'models/Stream', 'models/Post', 'models/User', 'lib/utility', 'sockets'],
    function (Backbone, vent, Stream, Post, User, utility, sockets) {
        'use strict';
        return Backbone.Collection.extend({
            /*
            Collection used on homepage, self-updated by socket.io

            Produces event on vent `stream:item_received`, callback apply 3 params:
            1. Stream object, which received
            2. bool, true if item already in collection
            3. bool, true if post suitable with current filters and will be shown to user
             */
            model: Stream,
            posts_type: 'all',
            num: 10,

            url: function(){
                return '/api/activity/stream/?num=' + this.num + '&type=' + this.posts_type;
            },
            getMore: function(callback){
                if(this.length == 0) return false;

                var url = this.url() + '&ldate='+ (+this.last().get('native_date') / 1000);

                var new_collection =  new (Backbone.Collection.extend({model: Stream}))();
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
                    }
                });
            },

            withCurrentFilter: function(model) {
                var post;
                if(!(post= model.post || model.get('post'))) return;
                var post_type = post.get('post_type');

                if (this.posts_type == 'all') { // All tab, hide activity posts
                    var is_own = post.get('is_own');

                    return post_type == 'user' || (post_type == 'follow' && !is_own)||(post_type == 'trade' && !is_own);
                } else if (this.posts_type == 'posts') { // Posts tab
                    return post_type == 'user';
                } else if(this.posts_type == 'links') {
                    var media = post.get('media');

                    return _.find(media, function(item) {
                        return item.type == 'embed';
                    });
                } else if(this.posts_type == 'trade') {
                    return post_type == 'trade';
                } else if (this.posts_type == 'activity') { // Activity tab
                    return post_type == 'follow' || post_type == 'activity';
                }
            },

            initialize: function (options) {
                // Listen to any model change and resort collection
                this.listenTo(this, 'change', this.sort, this);

                vent.off('stream:comments:collapse');
                vent.on('stream:comments:collapse', function(exclude) {
                    this.each(function(item) {
                        if(item.get('post').id != exclude) {
                            item.get('post').set({'show_comments': false});
                        }
                    });
                }, this);

                vent.off('stream:collection:reset');
                vent.on('stream:collection:reset', function() {
                    this.trigger('reset', this);
                }, this);

                vent.off('stream:addItem');
                vent.on('stream:addItem', function(item, options) {
                    options = options ? _.defaults(options, {merge: true}) : {};

                    if (this.withCurrentFilter(item)) {
                        this.add(item, options);

                        vent.trigger('stream:item_received', item, false, true);
                    }
                    vent.trigger('stream:item_received', item, false, false);
                }, this);

                var collection = this;
                // Update stream from socket.io
                // Remove listeners for previous Collection objects
                sockets.stream.removeAllListeners("message");
                sockets.stream.removeAllListeners("connect");
                sockets.stream.removeAllListeners("disconnect");

                sockets.stream.on('message', function (data) {
                    console.log('message from /stream', data);
                    try {
                        data = JSON.parse(data);
                    } catch (e) {
                        data = [];
                    }

                    //Iterate over received items and add them to collection
                    data.forEach(function (item) {
                        // Feels like broken
                        var collectionItem = collection.find(function(colItem) {
                            if(item.post.id == colItem.get('post').id) return true;
                        });

                        if (collectionItem) {
                            // Manually deserialize date
                            item.native_date = utility.deserializeDate(item.date);
                            item.post.native_date = utility.deserializeDate(item.post.date);

                            // Prevent post bumping if comments are shown
                            var opts = collectionItem.get('post').get('show_comments') ? {silent: true} : {};

                            // Because post is separate model and doesn't handled by set call
                            collectionItem.get('post').set(item.post, opts);
                            delete item.post;

                            collectionItem.set(item, opts);
                            item = collectionItem;

                            vent.trigger('stream:item_received', item, true);
                        } else {
                            item = Stream.sideLoadedCreate(item, {parse: true});

                            // It does not work in this case
                            item.get('post').set({
                                native_date: utility.deserializeDate(item.get('post').get('date'))
                            }, {silent: true});

                            vent.trigger('stream:addItem', item);
                        }
                        item.get('post').trigger('change');
                        collection.trigger('reset', collection);
                    });
                });
                sockets.stream.on('connect', function () {
                    console.log('connected to /stream');
                });
                sockets.stream.on('disconnect', function () {
                    console.log('disconnected from /stream');
                });

            },

            comparator: function (o) {
                return o.get('native_date') ? -o.get('native_date').getTime() : 0;
            }
        });

    });