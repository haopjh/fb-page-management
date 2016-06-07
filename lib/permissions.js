import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
    // Set facebook permissions here
    Accounts.ui.config({
        requestPermissions: {
            facebook: ['manage_pages', 'publish_pages', 'read_insights','ads_management']
        },
    });
}
    
