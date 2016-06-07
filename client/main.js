import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';

// Use this to listen to events
Tracker.autorun(function () {
    if (Meteor.userId()) {
        // Bring the user to overview page
        if (FlowRouter.current().path === "/") {
            FlowRouter.go("/overview");
        }
    } else {
        // Clear the session obj
        Session.set("pages", null);
        console.log("on logout")
        FlowRouter.go("/");
    }
});



// Here goes all the templates, events and helpers
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.overview.onCreated(function () {
    Meteor.call("listPages", function(err, res) {
        Session.set("pages", res);
    });
});

Template.overview.helpers({
    getPageList: function () {
        return Session.get("pages") || [];
    }
});

Template.page.onCreated(function () {
    // Get page from session storage
    let pageId = this.data.pageId();
    Meteor.call('getPage', pageId, function(err, res) {
        Session.set("page", res);
        Meteor.call('getPosts', res.id, res.access_token , function(err, post) {
            Session.set("posts", post);

            $(".post-container").removeClass("loading");

            let postImpressions = {};
            post.forEach(function(p) {
                Meteor.call('getPostImpression', p.id, res.access_token, function(err, res) {
                    postImpressions[p.id] = res;
                    Session.set("postImpressions", postImpressions);
                });
            });
        });
    });

});

Template.page.helpers({
    getPage: function () {
        return Session.get("page"); 
    },
    getPosts: function() {
        return Session.get("posts");
    },
    getPostImpression: function(id) {
        let impression = Session.get("postImpressions") || {};
        return impression[id] || "#";
    },
    getCount: function(arr) {
        return arr ? arr.length : 0;
    },
});

Template.page.events({
    'click .btn-create-post': function (e) {
        let value = $(".post-input").val();
        if (value && !$(e.currentTarget).hasClass("loading")) {
            let published = !$(e.currentTarget).hasClass("btn-unpublished-post")
            let page = Session.get("page");
            $(e.currentTarget).addClass("loading");
            
            Meteor.call("newPost", value, page.id, published, page.access_token, function (err, res) {
                if (res) {
                    let posts = Session.get("posts");
                    posts.unshift({
                        id: res.content.id,
                        from: {name: page.name},
                        likes: {summary: {total_count: 0}},
                        message: value,
                        is_published: true,
                        created_time: Date.now(),
                        is_published: published
                    });
                    Session.set("posts", posts);

                    $(e.currentTarget).removeClass("loading");
                    $(".post-input").val("")
                }
            });
        }
    },
})



