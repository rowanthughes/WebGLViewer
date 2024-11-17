export class EventEmitter {
    private events: { [key: string]: Function[] } = {};
  
    /** Subscribe to an event **/
    on(event: string, listener: Function): void {
      if (!this.events[event]) this.events[event] = [];
      this.events[event].push(listener);
    }
  
    /** Emit an event **/
    emit(event: string, args?: any): void {
      if (this.events[event]) {
        this.events[event].forEach((listener) => listener(args));
      }
    }
  }