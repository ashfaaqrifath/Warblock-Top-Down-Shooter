
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    emit(eventName, data) {
        // tell everyone listening to this message
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
        
        // also send it globally
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
}

export {EventEmitter};