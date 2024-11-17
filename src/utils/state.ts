import { EventEmitter } from './event-emitter';
import { GUIParams } from '../types/gui-types';

export class State extends EventEmitter {
    private state: GUIParams;

    constructor(initialState: GUIParams) {
        super();
        this.state = initialState;
    }

    public getState(): GUIParams {
        return this.state;
    }

    public updateState(partialState: Partial<GUIParams>): void {
        this.state = { ...this.state, ...partialState };
        this.emit('stateChanged', this.state);
    }
}