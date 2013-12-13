/**
 * Post model
 */

define(
    ['backbone', 'models/User', 'models/OpenPosition', 'models/Comment', 'collections/Comments', 'lib/utility'],
    function (Backbone, User, OpenPosition, Comment, Comments, utility) {
        return Backbone.StoreModel.extend({
            urlRoot: '/api/activity/posts/',
            url: function () {
                var origUrl = Backbone.Model.prototype.url.call(this);
                return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
            },
            relations: {
                user: {
                    type: Backbone.Rel.HasOne,
                    model: User,
                    fetch: {
                        success: function() {
                            console.log('I\'m watching you', arguments);
                        }
                    }
                },
            },
//            relations: [
//                {
//                    type: Backbone.HasMany,
//                    key: 'comments',
//                    relatedModel: Comment,
//                    collectionType: Comments,
//                    collectionOptions: function (model) {
//                        return {
//                            url: function () {
//                                return model.urlRoot + model.id + '/comments/';
//                            }
//                        }
//                    },
//                    reverseRelation: {
//                        key: 'post',
//                        includeInJSON: 'id'
//                    }
//                },
//                {
//                    type: Backbone.HasOne,
//                    key: 'user',
//                    relatedModel: User,
//                    autoFetch: false
//                },
//                {
//                    type: Backbone.HasOne,
//                    key: 'trade_position',
//                    relatedModel: OpenPosition,
//                    autoFetch: true
//                }
//            ],

//            lazyLoadUser: function() {
//                if (!this.get('user')) {
//                    var username = this.getRelation('user').keyContents;
//
//                    this.set({
//                        user: User.findOrCreate({
//                            username: username
//                        })
//                    }, {silent: true});
//
//                    if(!this.get('user') || !username) return;
//                }
//
//                if (this.get('user') && !this.get('user').synced) {
//                    this.get('user').synced = true;
//                    this.get('user').fetch();
//                }
//                this.get('user') && this.get('user').once('sync', function () {
//                    this.trigger('loaded');
//                }, this);
//            },

            initialize: function () {
                // Printable likes
                this.updateLikesPrintable();
                this.on('change:likes change:likes_count', this.updateLikesPrintable, this);

                // System computed properties
                this.updateSystemComputed();
                this.on('change:user', this.updateSystemComputed, this);

                // Because backbone relational does not do his work, we do it for him
                // once on change - if item in collection, they wont be fetched and sync does not fires
//                this.once('change', this.lazyLoadUser, this);
//                this.on('sync', this.lazyLoadUser, this);

                // Update comments count
                // TODO: When new item received by socket.io comments count does not updates
                this.on('add:comments remove:comments', function () {
                    this.set({comments_count: this.get('comments').length});
                }, this);

                this.set({
                    show_comments: false,
                    show_likes: false
                });
            },

            parse: function (data) {
                data.comments_count = data.comments ? data.comments.length : 0;
                data.is_own = data.user == preloaded_data.user.username;

                data.native_date = utility.deserializeDate(data.date);

                return data;
            },

            updateSystemComputed: function() {
                this.set({ is_own: this.get('user') && this.get('user').get('username') == preloaded_data.user.username });
            },

            updateLikesPrintable: function () {
                var likes = this.get('likes') || [];
                var likes_count = this.get('likes_count') || 0;

                if (!likes || !likes_count) this.set({ likes_printable: {} });

                this.set({
                    likes_printable: {
                        content: likes ? likes.slice(0, 2).join(', ') : [],
                        others: likes_count > 2 ? likes_count - 2 : 0
                    }
                });
            },

            comment: function(options) {
                var post = this;

                options.post = this.id;
                options.user = preloaded_data.user.username;
                options.date = new Date();

                var comment = window.com = new Comment(options);

                comment.save({}, {
//                    It's done automatically. Maybe by backbone-relational
//                    success: function() {
//                        post.get('comments').add(comment);
//                    }
                });

                return comment;
            },

            reportSpam: function(options){
                this.set({'possible_spam':true});
            },

            like: function (options) {
                var liked = this.get('liked');
                var likes = this.get('likes') || [];
                var likes_count = this.get('likes_count') || 0;
                var current_user = preloaded_data.user.username;

                options = options || {};
                _.extend(options, {
                    //If post liked - unlike and send "DELETE" request
                    type: liked ? 'DELETE' : 'POST',
                    dataType: 'json'
                });
                $.ajax(this.url() + 'likes/', options);

                if (liked) {
                    likes.splice(likes.indexOf(current_user), 1);
                    this.set({
                        liked: false,
                        likes_count: (likes_count - 1 < 0 ? 0 : likes_count - 1)
                    });
                } else {
                    likes.unshift(current_user);
                    this.set({
                        liked: true,
                        likes_count: likes_count + 1
                    });
                }
            }
        });
    }
);