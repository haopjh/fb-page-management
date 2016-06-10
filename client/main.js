import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

// Here goes all the templates, events and helpers


// Use this to listen to events
Tracker.autorun(function () {
    if (Meteor.userId()) {
        // Bring user to overview page
        if (FlowRouter.current().path === "/") {
            FlowRouter.go("/overview");
        }
    } else {
        // Clear the session obj and bring user to login page
        Session.set("pages", null);
        FlowRouter.go("/");
    }
});


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
        console.log(res);
        Meteor.call('getPosts', res.id, res.access_token , function(err, posts) {
            Session.set("posts", posts);

            $(".post-container").removeClass("loading");
            let postIdList = [];
            // Consolidate all ids to get it's respective impression
            for (let i in posts) {
                postIdList.push(posts[i].id);
            }

            Meteor.call('getPostsImpressions', pageId, postIdList, 
                            res.access_token, function(err, res) {
                Session.set("postImpressions", res);
            });
        });
    });

});

Template.page.helpers({
    getPage: function () {
        return Session.get("page"); 
    },
    getPosts: function() {
        console.log(Session.get("posts"));
        return Session.get("posts");
    },
    getPostImpression: function(id) {
        let impression = Session.get("postImpressions") || {};
        return impression[id] || "#";
    },
    getCount: function(arr) {
        return arr ? arr.length : 0;
    },

    showStatus: function(statusType) {
        let conversionList =  {
            mobile_status_update: "New Post", 
            created_note: "New note", 
            added_photos: "Photo post", 
            added_video: "Video post", 
            shared_story: "Shared post",
            created_group: "New Group", 
            created_event: "New Event", 
            wall_post: "Wall post", 
            app_created_story: "Story from app", 
            published_story: "Published story", 
            tagged_in_photo: "Tagged photo", 
            approved_friend: "New Friends"
        };

        return conversionList[statusType];
    },
});

Template.page.events({
    'click .btn-create-post': function (e) {
        let value = $(".post-input").val().trim();
        if (value && !$(e.currentTarget).hasClass("loading")) {
            let published = !$(e.currentTarget).hasClass("btn-unpublished-post")
            let page = Session.get("page");
            $(e.currentTarget).addClass("loading");
            
            Meteor.call("newPost", value, page.id, published, 
                            page.access_token, function (err, res) {
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

    'click .filter-options .btn': function(e) {
        $(".filter-options .btn").removeClass("active");
        let btnDiv = $(e.currentTarget);
        btnDiv.addClass("active");

        let containerDiv = btnDiv.closest(".post-container");
        containerDiv.attr("data-filter", btnDiv.attr("data-type"));
    }, 

    'click .glyp-delete': function (e) {
        let confirmation = confirm("Permanently remove this post?");

        if (confirmation) {
            let postId = $(e.currentTarget).closest(".post-item").attr("data-id");
            Meteor.call("deletePost", Session.get("page").id, postId, Session.get("page").access_token, function (err, res) {
                if (res) {
                    let posts = Session.get("posts");
                    posts = _.reject(posts, function (post) { 
                        return post.id === postId; 
                    });

                    // Update posts
                    Session.set("posts", posts);
                }

            });
        }
            
    },

    'click .glyp-edit': function (e) {
        // Show the edit btns and textarea
        let postItemDiv = $(e.currentTarget).closest(".post-item");
        postItemDiv.addClass("editing");
        postItemDiv.find("textarea").removeAttr("readonly");

    },

    'click .btn-edit-post': function (e) {
        // Revert edit styling to normal interface
        let postItemDiv = $(e.currentTarget).closest(".post-item");
        let value = postItemDiv.find("textarea").val().trim();
        let postId = postItemDiv.attr("data-id");
        $(e.currentTarget).parent().addClass("loading");

        Meteor.call("editPost",Session.get("page").id, value, postId, 
                    Session.get("page").access_token, function (err, res) {
            if (res) {
                $(e.currentTarget).parent().removeClass("loading");
                postItemDiv.removeClass("editing");
                postItemDiv.find("textarea").attr("readonly", "readonly");
            }
        });
            
    },


    // TODO: Pagination for feeds
    // 'click .btn-more': function (e) {
            
    // }
});



