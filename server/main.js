import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { InternalCache } from './InternalCache.js';

Meteor.startup(() => {
    // Need to check if user's access token is expired, if yes, kick user out
});

const graphUrl = Meteor.settings.graphUrl;

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
            // var results = [];

            // for (let i=0; i<res.data.data.length; i++) {
            //     if (res.data.data[i].status_type === "mobile_status_update" ||
            //         res.data.data[i].status_type === "added_photos") {
            //         results.push(res.data.data[i]);
            //     }
            // }
            internalCache.cache(key, res.data.data);

            return res.data.data;
        } else {
            // Return from cache
            return internalCache.retrieve(key);
        }
    },

    // Used to get impression for a single post
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

    // Used to get impressions for all posts
    getPostsImpressions: function (pageId, postIdList, accessToken) {
        let key = "postsImpression_"+pageId;
        if (internalCache.checkMemoryValidity(key)) {
            let results = {};
            let batch = [];

            for (let i in postIdList) {
                batch.push({
                    "method": "GET",
                    "relative_url": postIdList[i]+"/insights/post_impressions_unique",
                })
            }

            let res = HTTP.call('POST', graphUrl, {
                    params: {
                        access_token: accessToken,
                        batch: JSON.stringify(batch)
                    }
                });

            var results = res.data;

            var impressionList = {};

            // Parse the result list and 
            // convert it into a simple readable list
            try {
                for (let i in results) {
                    let result = JSON.parse(results[i].body);
                    let innerData = result.data[0].values;
                    impressionList[result.data[0].id.split("/")[0]] = 
                        result.data[0].values[0].value;
                }
            } catch (e) {
                //Incase something goes wrong
                console.error(e);
            }

            // Cache results
            internalCache.cache(key, impressionList);

            return impressionList;

        } else {
            // Return from cache
            return internalCache.retrieve(key);
        }
    },

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

        if (res.data.id) {
            internalCache.clear("posts_"+pageId);
            return res;
        }
            
    },

    deletePost: function (pageId, postId, pageAccessToken) {
        let res = HTTP.call('DELETE', 
            `${graphUrl}/${postId}`,
            {
                params: {
                    access_token: pageAccessToken
                }
            });
        
        if (res.data.success) {
            internalCache.clear("posts_"+pageId);
            return true;
        }
    },

    editPost: function (pageId, message, postId, pageAccessToken) {
        let res = HTTP.call('POST', 
            `${graphUrl}/${postId}`,
            {
                params: {
                    access_token: pageAccessToken,
                    message: message
                }
            });

        if (res.data.success) {
            internalCache.clear("posts_"+pageId);
            return res;
        }
        
    },

});