// Copyright (c) 2016-2022, Brandon Lehmann <brandonlehmann@gmail.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import Timer from '@gibme/timer';
import { EventEmitter } from 'events';

/** @ignore */
const cleanValue = (value: string, name: string): any => {
    if (value.toLowerCase() === 'yes') {
        return true;
    } else if (value.toLowerCase() === 'no') {
        return false;
    } else if (value.toLowerCase() === '(null)' ||
        value.toLowerCase() === '-none-') {
        return '';
    } else if (name.toLowerCase() === 'QualifyTimeout') {
        return parseFloat(value || '0') || 0;
    } else if (name.toLowerCase().includes('port')) {
        return parseInt(value || '0') || 0;
    }

    return value;
};

/**
 * Helps to process response payloads by dealing with multiple packets of data
 * and then emitting the full payload once received
 */
export default class PayloadManager extends EventEmitter {
    private _buffer: Buffer = Buffer.alloc(0);
    private _timer?: Timer;
    private object: any = {};

    /**
     * Constructs a new instance of the payload manager
     *
     * @param interval
     */
    constructor (public interval = 500) {
        super();
    }

    public on(event: 'flush', listener: () => void): this;

    public on<T>(event: 'packet', listener: (payload: T) => void): this;

    public on (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Stops the payload manager
     */
    public stop (): void {
        this._timer?.destroy();

        this.flush();
    }

    /**
     * Starts the payload manager
     *
     * @param interval
     */
    public start (interval = this.interval): void {
        this.interval = interval;

        this.flush();

        this._timer = new Timer(interval, true);

        this._timer.on('tick', () => {
            if (!this._timer) {
                return;
            }

            this._timer.paused = true;

            this.process();

            this._timer.paused = false;
        });
    }

    /**
     * Flushes the data buffer;
     */
    private flush (): void {
        this._buffer = Buffer.alloc(0);

        this.emit('flush');
    }

    /**
     * Append the data buffer to the existing data buffer
     *
     * @param data
     */
    public incoming (data: Buffer) {
        this._buffer = Buffer.concat([this._buffer, data]);
    }

    /**
     * Process the data collected so far
     *
     * @private
     */
    private process (): void {
        while (this._buffer.length !== 0) {
            const idx = this._buffer.indexOf('\r\n');

            if (idx === -1) break;

            const line = this._buffer.slice(0, idx + 2).toString().trim();

            this._buffer = this._buffer.slice(idx + 2);

            if (line.includes('Asterisk Call Manager')) continue;

            if (line.length === 0) {
                if (Object.keys(this.object).length !== 0) {
                    this.emit('packet', this.object);
                }

                this.object = {};

                continue;
            }

            const parts = line.split(':');

            const key = parts.shift()?.trim();

            if (!key) continue;

            const value = parts.join(':').trim();

            this.object[key] = cleanValue(value, key);
        }
    }
}
