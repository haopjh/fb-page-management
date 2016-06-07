import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { InternalCache } from './InternalCache.js';

Meteor.startup(() => {
    // Need to check if user's access token is expired, if yes, kick user out
});

const graphUrl = "https://graph.facebook.com/v2.6";

// Create a static inMemory caching function
let internalCache = new InternalCache();


Meteor.methods({
    listPages: function () {

        if (Meteor.user()) {

            let fbObj = Meteor.user().services.facebook;

            let key = "user_"+fbObj.id;
            if (internalCache.checkMemoryValidity(key)) {

                // Retrieve list of pages
                let res = HTTP.call('GET', 
                    `${graphUrl}/${fbObj.id}/accounts`,
                    {
                        params: {
                            access_token: fbObj.accessToken
                        }
                    });


                if (res.data) {
                    let dataList = res.data;
                    let pages = [];
                    dataList.data.forEach(function(data) {
                        pages.push({
                            id: data.id,
                            accessToken: data.access_token,
                            category: data.category,
                            name: data.name
                        });
                    });

                    return pages;
                }

                // Cache results
                internalCache.cache(key, res.data);

                return pages;
            } else {
                // Return from cache
                return internalCache.retrieve(key);
            }
        } else {
            return "User is not logged in";
        }
    },

    getPage: function (pageId) {
        let key = "page_"+pageId;
        if (internalCache.checkMemoryValidity(key)) {
            if (Meteor.user()) {
                let fbObj = Meteor.user().services.facebook;
                let res = HTTP.call('GET', 
                    `${graphUrl}/${pageId}`,
                    {
                        params: {
                            access_token: fbObj.accessToken,
                            fields: ["access_token","name", "category","id"]
                        }
                    });

                // Cache results
                internalCache.cache(key, res.data);

                return res.data;
            } else {
                return "User is not logged in";
            } 
        } else {
            // Return from cache
            return internalCache.retrieve(key);
        }
    },

    getPosts: function (pageId, accessToken) {

        let key = "posts_"+pageId;
        if (internalCache.checkMemoryValidity(key)) {
            let res = HTTP.call('GET', 
                `${graphUrl}/${pageId}/promotable_posts`,
                {
                    params: {
                        access_token: accessToken,
                        fields: ["id","message","likes.limit(0).summary(true)","created_time","from","is_published","status_type"]
                    }
                });

            // Cache results
            var results = [];

            for (let i=0; i<res.data.data.length; i++) {
                if (res.data.data[i].status_type === "mobile_status_update" ||
                    res.data.data[i].status_type === "added_photos") {
                    results.push(res.data.data[i]);
                }
            }
            internalCache.cache(key, results);

            return results;
        } else {
            // Return from cache
            return internalCache.retrieve(key);
        }
    },

    // Used for a single post
    getPostImpression: function (postId, accessToken) {
        let key = "postImpression_"+postId;
        if (internalCache.checkMemoryValidity(key)) {

            let res = HTTP.call('GET', 
                `${graphUrl}/${postId}/insights/post_impressions_unique`,
                {
                    params: {
                        access_token: accessToken,
                        fields: ["values"]
                    }
                });

            // Cache results
            internalCache.cache(key, res.data.data[0].values[0].value);
                
            return res.data.data[0].values[0].value;
        } else {
            // Return from cache
            return internalCache.retrieve(key);
        }
    },

    // Used for all posts
    // getPostsImpressions: function (pageId, posts, accessToken) {
        // let key = "postsImpression_"+pageId;
        // if (internalCache.checkMemoryValidity(key)) {
        //     let results = {};
        //     posts.forEach(function (post) {
        //         let res = HTTP.call('GET', 
        //             `${graphUrl}/${post.id}/insights/post_impressions_unique`,
        //             {
        //                 params: {
        //                     access_token: accessToken,
        //                     fields: ["values"]
        //                 }
        //             });
        //         results[post.id] = res.data.data[0].values[0].value;
        //     });

        //     // Cache results
        //     inMemory[key] = {
        //         timestamp: Date.now() / 1000,
        //         data: res.data.data[0].values[0].value
        //     }
            
        //     return results;
        // } else {
        //     return inMemory[key].data;
        // }
    // }

    newPost: function (message, pageId, published, pageAccessToken) {
        let res = HTTP.call('POST', 
            `${graphUrl}/${pageId}/feed`,
            {
                params: {
                    access_token: pageAccessToken,
                    message: message,
                    published: published
                }
            });
        internalCache.clear("posts_"+pageId);
        return res;
    }

});