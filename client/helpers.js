// Generic helpers
import { Template } from 'meteor/templating';
const monthList = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct" , "Nov" , "Dec"
];

Template.registerHelper('getTime', function(time){
    let date = new Date(time);
    let day = date.getDate() < 10 ? 
        "0" + date.getDate() : date.getDate();
    let month = monthList[date.getMonth()];
    let year = Math.abs(2000-date.getFullYear());

    return `${day} ${month} '${year}`

});