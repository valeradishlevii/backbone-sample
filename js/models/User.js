/**
 * User model
 */

define(
    ['backbone', 'backbone_relational'],
    function (Backbone) {
        return Backbone.StoreModel.extend({
            synced: false,
            initialize: function () {
                this.once('sync', function() {
                    this.synced = true;
                }, this);

                this.set('is_iam', preloaded_data.user.username == this.get('username'));
                if(!this.get('avatar')){
                    this.set({
                        // Default values for avatar
                        avatar: this.defAvatar
                    });
                }
            },

            defAvatar: {
                'full': preloaded_data.app_static_url + 'img/placeholder-68x68.gif',
                '36x36': preloaded_data.app_static_url + 'img/placeholder-36x36.gif',
                '42x42': preloaded_data.app_static_url + 'img/placeholder-42x42.gif',
                '68x68': preloaded_data.app_static_url + 'img/placeholder-68x68.gif'
            },

            parse: function(data) {
                if(!data.avatar) delete data.avatar;

                return data;
            },
            urlRoot: '/api/activity/users/',
            toggle_follow: function () {
                this.set('is_following', !this.get('is_following'));
                this.save();
            },
            url: function () {
                var origUrl = Backbone.Model.prototype.url.call(this);
                return origUrl + (origUrl.charAt(origUrl.length - 1) == '/' ? '' : '/');
            },
            idAttribute: 'username'
        });
    }
);