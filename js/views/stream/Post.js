/**
 * Single stream post in my stream
 */

define(
    ['marionette', 'vent', 'models/SpamReport', 'models/Post'],
    function (Marionette, vent, SpamReport, Post) {
        "use strict";

        return Marionette.ItemView.extend({
            tagName: 'li',

            events: {
                'click .like-btn': 'like',
                'click .hide-btn': 'hide',
                'click .toggle_comments-btn': 'toggleComments',
                'click .toggle_likes-btn': 'toggleLikes',
                'click .add-comment': 'addComment',
                'click .report-spam-btn': 'reportSpamPost',
                'click .report-spam-comment-btn': 'reportSpamComment',
                'click .trade__copy__open_modal': 'openCopyTradeDlg',
            },

            ui: {
                addCommentTextarea: '[name="commentValue"]',
                addCommentButton: '.add-comment',
                commentsList: '.comments-list',
                charLeft: '.char-left'
            },
            postDetail: false,
            openCopyTradeDlg: function(e){
                var trade_position = this.getPost().get("trade_position");
                console.log(trade_position);
                vent.trigger(   'open_trade:show',
                                trade_position.get('slug'),
                                null,
                                {
                                    position:trade_position
                                }
                            );
                e.preventDefault(false);
            },
            like: function (e) {
                this.getPost().like();

                e.preventDefault(false);
            },

            hide: function(e) {
                var is_own = this.getPost().get('is_own');

                if (confirm("Are you really want to " + (is_own ? 'delete' : 'hide') + " this post?")) {
                    if (is_own) {
                        this.getPost().destroy();
                    } else {
                        this.model.destroy();
                    }
                    this.close();
                }

                e.preventDefault(false);
            },

            loadingComments: false,
            toggleComments: function(e, open) {
                var view = this;
                var post = this.getPost();
                var show_comments = post.get('show_comments');

                if(open || !show_comments) {
                    // Flag which indicates comments loading
                    this.loadingComments = true;

                    post.get('comments').fetch({
                        success: function() {
                            view.loadingComments = false;
                        },
                        reset: true
                    });
                }
                vent.trigger('stream:comments:collapse', post.id);

                post.set({show_comments: open || !show_comments});

                e && e.preventDefault(false);
            },

            toggleLikes: function(e) {
                this.getPost().set({ show_likes: !this.getPost().get('show_likes') });

                e.preventDefault(false);
            },

            reportSpamPost: function(e){
                if (confirm("Are you sure?")) {
                    var post = this.getPost();
                    post.reportSpam();

                    (new SpamReport({'type': 'post', 'pk': post.id})).save();
                }

                e.preventDefault(false);
            },

            reportSpamComment: function(e){
                if (confirm("Are you sure?")) {
                    var comment = this.getPost().get('comments').get($(e.currentTarget).parents('li[data-id]').attr('data-id'));
                    comment.reportSpam();

                    (new SpamReport({'type':'comment','pk':comment.id})).save();
                }

                e.preventDefault(false);
            },

            addComment: function(e)  {
                var val = this.ui.addCommentTextarea.val().trim();

                if(val) {
                    this.getPost().comment({
                        content: val
                    });

                    this.ui.addCommentTextarea.val('');
                }

                e && e.preventDefault(false);
            },

            onRender: function() {
                if(this.options.stream) {
                    if(this.model.get('hidden')) {
                        this.$el.addClass('hide');
                    } else {
                        this.$el.removeClass('hide');
                    }
                }
//                this.$el[this.options.stream && this.model.get('hidden') ? 'addClass' : 'removeClass']('hide');

                this.$el.addClass(this.css_class);
                this.$el.find('.like-btn').tooltip();
                this.$el.find('.reason-btn').tooltip();

                if (!this.loadingComments && this.getPost().get('show_comments')) {
                    this.ui.commentsList.removeClass('loading');
                }

                if (this.ui && this.ui.addCommentTextarea) {
                    this.ui.addCommentTextarea.off('input');
                    $('textarea[name=commentValue]').focus();
                    this.ui.addCommentTextarea.on('input', _.bind(function (e) {
                        var value = e.target.value;

                        if (!value.trim() || value.length > 180) this.ui.addCommentButton.attr('disabled', 'disabled');
                        else this.ui.addCommentButton.removeAttr('disabled');

                        this.ui.charLeft.parent()[value.length > 180 ? 'addClass' : 'removeClass']('red');

                        this.ui.charLeft.text(180 - value.length);

                    }, this));

                    this.ui.addCommentTextarea.on('keydown', _.bind(function (e) {
                        if (e.ctrlKey && e.keyCode === 13) {
                            this.addComment();
                        }
                    }, this));
                }
            },

            getTemplate: function() {
                var type = this.getPost().get('post_type');

                if(type == "activity"){
//                    this.css_class = 'stream-action-' + this.model.get('reason')[0].action;
                    this.css_class = 'timeline-item-post';
//                    this.css_class = 'stream-system-post';

                    return 'stream/activity_post';
                } else if(type == "user"){
//                    this.css_class = 'stream-user-post';
                    this.css_class = 'timeline-item-post';

                    return 'stream/user_post';
                } else if(type == "trade"){
//                    this.css_class = 'stream-trade-post';
                    this.css_class = 'timeline-item-post';
                    return 'stream/trade_post';
                } else if(type == 'follow') {
//                    this.css_class = 'stream-system-post';
                    this.css_class = 'timeline-item-status';

                    return 'stream/follow_post';
                }

                return 'stream/user_post';
            },


            serializeData: function() {
                var data = {
                    post_detail: this.post_detail
                };

                if(this.options.stream) {
                    data = {
                        stream: this.model.toJSON(),
                        post: this.model.get('post').toJSON()
                    };
                } else {
                    data.post = this.model.toJSON();
                }
                data.need_to_show_copy = data.post.content&&(data.post.content.indexOf("went")!=-1);
                return data;
            },

            // Always use post model if this stream record or directly post
            getPost: function() {
                return this.model.get('post') || this.model;
            },

            initialize: function () {
                // Attached two events to post, because `change` not always firing on load
                this.listenTo(this.getPost(), 'change loaded', this.render, this);

                // Comments
                var comments;
                if((comments = this.getPost().get('comments'))) {
//                    this.listenTo(comments, 'all', this.render, this);
                }
            }
        });
    });
