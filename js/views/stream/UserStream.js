/**
 * My stream
 */

define(
    ['marionette', 'vent', 'views/stream/Post', 'views/stream/PostsEmpty', 'views/posts/FilterableMixin', 'views/common/ExternalLinksMixin'],
    function (Marionette, vent, ItemView, NoItemsView, FilterableMixin, ExternalLinksMixin) {
        "use strict";

        return Marionette.CompositeView.extend({
            template: 'stream/user_stream',
            itemView: ItemView,
            emptyView: NoItemsView,
            itemViewContainer: 'ul#user-stream',
            itemViewOptions: {
                stream: true
            },
            filterField: 'posts_type',

            events: {
                'click .btn-show-new-posts': 'showNewPosts'
            },

            ui: {
                postsList: '.stream-list',
                newPostsButton: '.btn-show-new-posts'
            },

            checkScroll: function () {
                var triggerPoint = 100; // 100px from the bottom
                if( !this.loadingState() && this.collection.length && $(document).scrollTop() + $(window).height() + triggerPoint > this.el.scrollHeight ) {
                    this.load_more();
                }
            },

            load_more:function(){
                this.loadingState(true);
                this.collection.getMore(_.bind(function(){
                    this.loadingState(false);
                }, this));
            },

            appendHtml: function (collectionView, itemView, index) {
                var childrenContainer = collectionView.itemViewContainer ? collectionView.$(collectionView.itemViewContainer) : collectionView.$el;
                var children = childrenContainer.children();
                if (children.size() - 1 <= index) {
                    childrenContainer.append(itemView.el);
                } else {
                    childrenContainer.children().eq(index).before(itemView.el);
                }
            },

            showNewPosts: function(e) {
                this.collection.each(function(item) {
                    if(!this.new_posts) return;

                    item.set({hidden: false});

                    this.new_posts--;
                }, this.collection);

                this.ui.newPostsButton.addClass('hide');
                document.title = document.title.replace(/^\((\d+)\) /, '');
            },

            onRender: function () {
                this.listenTo(vent, 'stream:item_received', function(item, in_collection, will_show) {
                    // Find first visible post, and indicate that is new post or pulled by `follow` action
                    // Little tricky, because collection sorted by date, and hidden posts still in collection, but not viewed to user
                    var first_visible = this.collection.find(function(item) {
                        return !item.get('hidden');
                    });

                    // If there is old message, don't hide it and show button. Just insert into collection
                    if(first_visible && first_visible.get('native_date') > item.get('native_date')) return;

                    // Show button and hide received items, if post not in collection and post - not by current user, and if post should appears with current filter
                    if(!in_collection && will_show && item.get('post').get('user').get('username') != preloaded_data.user.username) {
                        item.set({hidden: true});

                        ++this.collection.new_posts || (this.collection.new_posts = 1);

                        this.ui.newPostsButton.removeClass('hide')
                                              .find('.posts-count')
                                              .text(this.collection.new_posts);


                        var title = document.title;
                        var pos = title.indexOf(')');
                        document.title = '(' + this.collection.new_posts + ') ' + title.slice(pos == -1 ? 0 : pos + 2);
                    }
                }, this);

                $(window).on('scroll', this.checkScroll);

                $('.userstream-addpost').removeClass('hide');
            },

            onClose: function () {
                $('.userstream-addpost').addClass('hide');

                $(window).off('scroll', this.checkScroll);
            },

            loadingState: function(value) {
                if(typeof value == 'undefined') return this.isLoading;

                this.isLoading = value;
                this.trigger("loadingState", value);
            },

            displayPostsLoaded: function() {
                this.$el.find('.stream-list').removeClass('loading');
            },

            initialize: function () {
                _.bindAll(this, 'checkScroll');

                // Maybe redundant
                this.listenTo(this.collection, 'add remove change', this._renderChildren, this);

                // When loading state changed - show or hide loader block
                this.on("loadingState", function(value) {
                    this.$el.find('.posts-loading').css('display', value ? 'block' : 'none');
                }, this);

                // When are models are loaded and rendered - remove loading class
                this.on('itemview:render', function (itemview) {
                    if(this.collection.last()) {
                        if (!itemview || (itemview.model.id == this.collection.last().id)) {
                            this.displayPostsLoaded();
                        }
                    }
                }, this);

                this.on('collection:filter', function() {
                    this.$el.find('.stream-list').addClass('loading');
                });

                this.loadingState(true);
                this.collection.on('reset', function() {
                    this.loadingState(false);
                    if(this.collection.length == 0) this.displayPostsLoaded();
                }, this);
            }
        }).mixIn(FilterableMixin, ExternalLinksMixin);
    });

