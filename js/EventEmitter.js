// ===========================
// EVENT EMITTER 
// ===========================
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
        // Call internal listeners if they exist
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => callback(data));
        }
        
        // Also dispatch as a window event so Main.js can listen
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }
}

export {EventEmitter};