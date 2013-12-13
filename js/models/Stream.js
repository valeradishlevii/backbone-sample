/**
 * Item in stream model
 */

define(
    ['backbone', 'models/Post', 'lib/utility'],
    function (Backbone, Post, utility) {
        var model = Backbone.StoreModel.extend({
            urlRoot: '/api/activity/stream/',
            url: function () {
                var origUrl = Backbone.Model.prototype.url.call(this);
                return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
            },
            initialize: function() {
                window.o = this;
            },
            parse: function (response) {
                response.native_date = utility.deserializeDate(response.date);
                return response;
            },
            relations: {
                post:{
                    type: Backbone.Rel.HasOne,
                    key: 'post',
                    model: Post,
                    fetch: {
                        success: function (model) {
                            model.trigger('loaded');
                        }
                    }
                }
              }
//            relations: [{
//                type: Backbone.HasOne,
//                key: 'post',
//                relatedModel: Post,
//                autoFetch: {
//                    success: function(model) {
//                        model.trigger('loaded');
//                    }
//                }
//            }]
        });

        model.sideLoadedCreate = function(data, options) {
            var item, post;
            options = options ? _.defaults(options, {silent: true}) : {};

            // Prepare data
            if(data.date) {
                data.native_date = utility.deserializeDate(data.date)
            }

            item = model.findOrCreate({id: data.id}, options);
            post = Post.findOrCreate({
                id: data.post.id
            }).set(data.post, {silent: true});

            data.post = post;
            item.set(data, {silent: true});

            return item;
        };

        return model
    }
);