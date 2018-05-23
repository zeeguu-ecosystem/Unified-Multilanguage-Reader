import $ from 'jquery'
import Mustache from 'mustache';
import config from '../config';
import Notifier from '../Notifier';
import 'loggly-jslogger';
import UserActivityLogger from '../UserActivityLogger';
import ZeeguuRequests from '../zeeguuRequests';
import {GET_SUBSCRIBED_SEARCHES} from '../zeeguuRequests';
import {SUBSCRIBE_SEARCH_ENDPOINT} from '../zeeguuRequests';
import {UNSUBSCRIBE_SEARCH_ENDPOINT} from '../zeeguuRequests';


const HTML_ID_SUBSCRIPTION_LIST = '#searchesList';
const HTML_ID_SUBSCRIPTION_TEMPLATE = '#subscription-template-search';
const HTML_CLASS_REMOVE_BUTTON = '.removeButton';
const USER_EVENT_FOLLOWED_FEED = 'FOLLOW SEARCH';
const USER_EVENT_UNFOLLOWED_FEED = 'UNFOLLOW SEARCH';

/* Setup remote logging. */
let logger = new LogglyTracker();
logger.push({
    'logglyKey': config.LOGGLY_TOKEN,
    'sendConsoleErrors' : true,
    'tag' : 'SearchSubscriptionList'
});

/**
 * Shows a list of all subscribed topics, allows the user to remove them.
 * It updates the {@link ArticleList} accordingly.
 */
export default class SearchSubscriptionList {
    /**
     * Initialise an empty {@link Map} of feeds.
     */
    constructor() {
        this.searchList = new Map();
    }

    /**
     *  Call zeeguu and retrieve all currently subscribed feeds.
     *  Uses {@link ZeeguuRequests}.
     */
    load() {
        ZeeguuRequests.get(GET_SUBSCRIBED_SEARCHES, {}, this._loadSubscriptions.bind(this));
    };

    /**
     * Remove all feeds from the list, clear {@link ArticleList} as well.
     */
    clear() {
        $(HTML_ID_SUBSCRIPTION_LIST).empty();
    };

    /**
     * Call clear and load successively.
     */
    refresh() {
        // Refresh the feed list.
        this.clear();
        this.load();
    };

    /**
     * Fills the subscription list with all the subscribed feeds.
     * Callback function for the zeeguu request,
     * makes a call to {@link ArticleList} in order to load the feed's associated articles.
     * @param {Object[]} data - List containing the feeds the user is subscribed to.
     */
    _loadSubscriptions(data) {
        for (let i = 0; i < data.length; i++) {
            this._addSubscription(data[i]);
        }

        //this._changed();
    }

    /**
     * Add the feed to the list of subscribed feeds.
     * @param {Object} feed - Data of the particular feed to add to the list.
     */
    _addSubscription(search) {
        if (this.searchList.has(search.id))
            return;

        let template = $(HTML_ID_SUBSCRIPTION_TEMPLATE).html();
        let subscription = $(Mustache.render(template, search));
        let removeButton = $(subscription.find(HTML_CLASS_REMOVE_BUTTON));
        let _unfollow = this._unfollow.bind(this);
        removeButton.click(function(search) {
            return function () {
                _unfollow(search);
            };
        }(search));
        $(HTML_ID_SUBSCRIPTION_LIST).append(subscription);
        this.searchList.set(search.id, search);
    }

    /**
     * Subscribe to a new search, calls the zeeguu server.
     * Uses {@link ZeeguuRequests}.
     * @param {Object} search_terms - Data of the particular feed to subscribe to.
     */
    follow(search_terms) {
        UserActivityLogger.log(USER_EVENT_FOLLOWED_FEED, search_terms);
        let callback = ((data) => this._onFeedFollowed(search_terms, data)).bind(this);
        ZeeguuRequests.get(SUBSCRIBE_SEARCH_ENDPOINT + "/" + search_terms , {}, callback);
    }

    /**
     * A feed has just been followed, so we call the {@link ArticleList} to update its list of articles.
     * If there was a failure to follow the feed, we notify the user.
     * Callback function for Zeeguu.
     * @param {Object} search_terms - Data of the particular feed that has been subscribed to.
     * @param {string} reply - Reply from the server.
     */
    _onFeedFollowed(search_terms, reply) {
        if (reply != null) {
            this._addSubscription(reply);
            this._changed();
        } else {
            Notifier.notify("Network Error - Could not follow " + search_terms + ".");
            logger.push("Could not follow '" + search_terms + "'. Server reply: \n" + reply);
        }
    }

    /**
     * Un-subscribe from a feed, call the zeeguu server.
     * Uses {@link ZeeguuRequests}.
     * @param {Object} search - Data of the particular feed to unfollow.
     */
    _unfollow(search) {
        UserActivityLogger.log(USER_EVENT_UNFOLLOWED_FEED, search);
        this._remove(search);
        let callback = ((data) => this._onFeedUnfollowed(search, data)).bind(this);
        ZeeguuRequests.get(UNSUBSCRIBE_SEARCH_ENDPOINT + "/" + search.id, {}, callback);
    }

    /**
     * A feed has just been removed, so we remove the mentioned feed from the subscription list.
     * On failure we notify the user.
     * Callback function for zeeguu.
     * @param {Object} feed - Data of the particular feed to that has been unfollowed.
     * @param {string} reply - Server reply.
     */
    _onFeedUnfollowed(search, reply) {
        if (reply === "OK") {
            this._changed();
        } else {
            Notifier.notify("Network Error - Could not unfollow " + search.search + ".");
            logger.push("Could not unfollow '" + search.search + "'. Server reply: \n" + reply);
        }
    }

    /**
     * Remove a mentioned feed from the local list (not from the zeeguu list).
     * Makes sure the associated articles are removed as well by notifying {@link ArticleList}.
     * @param {Object} feed - Data of the particular feed to remove from the list.
     */
    _remove(search) {
        if (!this.searchList.delete(search.id))  { console.log("Error: search not in feed list."); }
        $('span[removableID="' + search.id + '"]').fadeOut();
    }

    /**
     * Fire an event to notify change in this class.
     */
    _changed() {
        document.dispatchEvent(new CustomEvent(config.EVENT_SUBSCRIPTION));
    }
};
