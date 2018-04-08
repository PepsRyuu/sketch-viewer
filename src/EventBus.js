/**
 * PubSub messaging class.
 *
 * @class EventBus
 */ 
export class EventBus {
    constructor () {
        this._subscribers = [];
    }

    /**
     * Listen for event.
     *
     * @method subscribe
     * @param {String} eventName
     * @param {Function} callback
     * @return {Object}
     */
    subscribe (eventName, callback) {
        let handle = {eventName, callback};
        this._subscribers.push(handle);

        return {
            unsubscribe: () => {
                let index = this._subscribers.indexOf(handle);
                this._subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Trigger the event.
     *
     * @method eventName
     * @param {Any} data
     */
    publish (eventName, data) {
        this._subscribers.forEach(handle => {
            if (handle.eventName === eventName) {
                handle.callback(data);
            }
        });
    }
}

export default new EventBus();
