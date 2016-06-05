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
        console.log(res.access_token)
        Meteor.call('getPost', res.id, res.access_token , function(err, post) {
            Session.set("post", post.data);
            let postImpressions = {};
            post.data.forEach(function(p) {
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
    getPost: function() {
        return Session.get("post");
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
        if (value) {
            let page = Session.get("page");

            // Meteor.call("newPost", value, page.id, page.access_token, function (err, res) {
            //     if (res) {

            //     }
            // });
        }
    },
})



