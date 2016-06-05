import { Meteor } from 'meteor/meteor';

FlowRouter.route('/', {
    action: function(params, queryParams) {
        BlazeLayout.render('login');
    }
});
FlowRouter.route('/overview', {
    action: function(params, queryParams) {
        if (Meteor.userId()) {
            BlazeLayout.render('overview');
        } else {
            FlowRouter.go('/');
        }
    }
});

FlowRouter.route('/page/:pageId', {
    action: function(params, queryParams) {
        // Checks if there is an existing user
        if (Meteor.userId()) {
            BlazeLayout.render('page', {pageId: params.pageId});
        } else {
            FlowRouter.go('/');
        }
    }
});

FlowRouter.notFound = {
    action: function() {
        FlowRouter.go('/overview');
    }
};