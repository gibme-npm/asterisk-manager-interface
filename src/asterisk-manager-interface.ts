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

import { Socket } from 'net';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';
import { AMI as AMITypes } from './types';
import PayloadManager from './payload-manager';
import Timer from '@gibme/timer';

export { AMITypes };

/**
 * Helps to clean up any status type responses
 *
 * @param elem
 */
export const cleanupStatus = <Type = any>(elem: Type): Type => {
    (elem as any).Time = -1;
    (elem as any).Online = false;

    if (typeof (elem as any).Status === 'undefined') {
        (elem as any).Status = 'UNKNOWN';
    } else if ((elem as any).Status.toUpperCase().includes('OK')) {
        if ((elem as any).Status.includes('ms')) {
            (elem as any).Time = parseInt((elem as any).Status.split('(')[1].split(' ms')[0]);
        }
        (elem as any).Online = true;
        (elem as any).Status = (elem as any).Status.split(' ')[0];
    }

    return elem;
};

export interface OptionalOptions {
    host: string;
    port: number;
    defaultMaxListeners: number;
    /**
     * @default true
     */
    autoReconnect: boolean;
    /**
     * @default true
     */
    keepAlive: boolean;
    /**
     * @default 500 ms
     */
    readInterval: number;
    /**
     * Keep alive interval in milliseconds
     *
     * @default 30000
     */
    keepAliveInterval: number;
    /**
     * The number of milliseconds to wait for the underlying socket to connect
     * @default 5000
     */
    connectionTimeout: number;
}

export interface RequiredOptions {
    user: string;
    password: string;
}

export interface AMIConnectionOptions extends Partial<OptionalOptions>, RequiredOptions {}
export interface AMIConnectionOptionsFinal extends OptionalOptions, RequiredOptions {}

export default class AsteriskManagerInterface extends EventEmitter {
    private _socket?: Socket;
    private _payloadManager;
    private options: AMIConnectionOptionsFinal;
    private _authenticated = false;
    private _keepAliveTimer?: Timer;

    /**
     * Constructs a new instance of AMI connection
     * @param options
     */
    constructor (options: AMIConnectionOptions) {
        super();

        options.host ||= '127.0.0.1';
        options.port ||= 5038;
        options.defaultMaxListeners ||= 20;
        options.autoReconnect ??= true;
        options.keepAlive ??= true;
        options.keepAliveInterval ||= 30_000;
        options.connectionTimeout ||= 5_000;
        options.readInterval ||= 500;

        this.options = options as any;

        this.setMaxListeners(this.options.defaultMaxListeners);

        this._payloadManager = new PayloadManager(this.options.readInterval);

        this._payloadManager.on('packet', payload => this.emit('response', payload));
    }

    /**
     * Returns if the connection is authenticated
     */
    public get authenticated (): boolean {
        return this._authenticated;
    }

    public on(event: 'close', listener: (hadError?: boolean) => void): this;

    public on(event: 'error', listener: (error: Error) => void): this;

    public on(event: 'connect', listener: () => void): this;

    public on<T = any>(event: 'response', listener: (payload: T) => void): this;

    public on (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public once<T = any>(event: 'response', listener: (payload: T) => void): this;

    public once (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Pings the AMI connection (keepalive)
     */
    public async ping (): Promise<boolean> {
        const response = await this.send<AMITypes.Pong>({
            Action: 'Ping'
        });

        return response.Response === 'Success' && response.Ping === 'Pong';
    }

    /**
     * Deletes a Database entry
     *
     * @param family
     * @param key
     */
    public async db_del (family: string, key: string): Promise<boolean> {
        const response = await this.send<AMITypes.AMIPayload>({
            Action: 'DBDel',
            Family: family,
            Key: key
        });

        return response.Response === 'Success';
    }

    /**
     * Deletes the Database tree
     *
     * @param family
     * @param key
     */
    public async db_del_tree (family: string, key: string): Promise<boolean> {
        const response = await this.send<AMITypes.AMIPayload>({
            Action: 'DBDelTree',
            Family: family,
            Key: key
        });

        return response.Response === 'Success';
    }

    /**
     * Gets a Database entry
     *
     * @param family
     * @param key
     */
    public async db_get (family: string, key: string): Promise<{ key: string, value: string } | undefined> {
        try {
            const response = await this.send<AMITypes.AMIPayloadWithList<{ Key: string; Val: string; }>>({
                Action: 'DBGet',
                Family: family,
                Key: key
            });

            return response.List.map(record => {
                return {
                    key: `/${family}/${record.Key}`,
                    value: record.Val
                };
            }).shift();
        } catch {
            return undefined;
        }
    }

    /**
     * Gets Database entries, optionally at a particular family/key
     *
     * @param family
     * @param key
     */
    public async db_get_tree (family?: string, key?: string): Promise<{ key: string; value: string }[]> {
        try {
            const request: AMITypes.AMIRequest = {
                Action: 'DBGetTree'
            };

            if (family) {
                request.Family = family;

                if (key) {
                    request.Key = key;
                }
            }

            const response = await this.send<AMITypes.AMIPayloadWithList<{ Key: string; Val: string; }>>(request);

            return response.List.map(record => {
                return {
                    key: record.Key,
                    value: record.Val
                };
            });
        } catch {
            return [];
        }
    }

    /**
     * Puts a Database entry
     *
     * @param family
     * @param key
     * @param value
     */
    public async db_put (family: string, key: string, value: string): Promise<boolean> {
        const response = await this.send<AMITypes.AMIPayload>({
            Action: 'DBPut',
            Family: family,
            Key: key,
            Val: value
        });

        return response.Response === 'Success';
    }

    /**
     * Closes the connection to the server
     */
    public async close (): Promise<void> {
        this._keepAliveTimer?.destroy();

        this._authenticated = false;

        this._payloadManager.stop();

        this._socket?.destroy();

        delete this._socket;
    }

    /**
     * Attempts to log into the server over the AMI connection
     *
     * @param user
     * @param password
     */
    public async login (
        user = this.options.user,
        password = this.options.password
    ): Promise<boolean> {
        await this.init();

        const response = await this.send<AMITypes.Login>({
            Action: 'Login',
            Username: user,
            Secret: password,
            Events: 'off'
        });

        if (response.Response === 'Success') {
            this._authenticated = true;

            if (this.options.keepAlive) {
                this._keepAliveTimer = new Timer(this.options.keepAliveInterval, true);

                this._keepAliveTimer.on('tick', async () => {
                    try {
                        await this.ping();
                    } catch {}
                });
            }

            this._socket?.on('end', async () => await this.handleReconnect());
            this._socket?.on('error', async (error: Error) => await this.handleReconnect(error));
        }

        return response.Response === 'Success';
    }

    /**
     * Checks if the specified module is loaded on the server
     *
     * @param module
     */
    public async moduleCheck (module: string): Promise<boolean> {
        try {
            await this.send({
                Action: 'ModuleCheck',
                Module: module
            });

            return true;
        } catch {
            return false;
        }
    }

    /**
     * Sends the AMI payload and awaits the response form the server
     *
     * @param payload
     */
    public async send<ResponseType extends AMITypes.AMIPayload = any,
        RequestType extends AMITypes.AMIRequest = any> (
        payload: RequestType
    ): Promise<ResponseType> {
        return this.write(payload);
    }

    /**
     * Initializes our socket by creating a connection
     *
     * @private
     */
    private async init (): Promise<void> {
        await this.close();

        this._payloadManager.start();

        this._socket = new Socket();
        this._socket.on('close', (hadError: boolean) => this.emit('close', hadError));

        this._socket.once('data', data => {
            if (data.toString().includes('Asterisk Call Manager')) {
                this.emit('connect');
            }
        });

        this._socket.on('data', data => this._payloadManager.incoming(data));

        return new Promise((resolve, reject) => {
            if (!this._socket) {
                return reject(new Error('Socket unavailable'));
            }

            // if we don't connect in the time allowed, we aren't going to connect
            const timer = setTimeout(() => {
                this._socket?.destroy();

                return reject(new Error('Connection timed out'));
            }, this.options.connectionTimeout);

            this._socket?.once('error', error => reject(error));

            this._socket?.connect({
                port: this.options.port,
                host: this.options.host,
                keepAlive: true,
                noDelay: true
            }, () => {
                clearTimeout(timer);

                this._socket?.removeAllListeners('error');
                this._socket?.on('error', error => this.emit('close', error));

                return resolve();
            });
        });
    }

    /**
     * Handles errors and disconnections
     *
     * @param error
     * @private
     */
    private async handleReconnect (error?: Error) {
        if (error) {
            this.emit('error', error);
        }

        if (!this._socket?.destroyed && this.options.autoReconnect) {
            await this.init();
        } else {
            await this.close();
        }
    }

    /**
     * Attempts to send an AMI command and await the reply
     *
     * @param payload
     * @private
     */
    private async write<ResponseType extends AMITypes.AMIPayload = any,
        RequestType extends AMITypes.AMIRequest = any> (
        payload: RequestType
    ): Promise<ResponseType> {
        if (!this.authenticated && payload.Action !== 'Login') {
            if (!(await this.login())) {
                throw new Error('Connection not authenticated');
            }
        }

        return new Promise((resolve, reject) => {
            const uuid = (payload as any).ActionID = v4();

            const request: string[] = [];

            for (const key of Object.keys(payload as any)) {
                request.push(`${key}: ${(payload as any)[key]}`);
            }

            const _request = `${request.join('\r\n')}\r\n\r\n`;

            const result: any[] = [];

            const handler = (response: any) => {
                if (response.ActionID === uuid) {
                    result.push(response);
                }

                if (result.length === 0) return;

                if (result[0].Response !== 'Success') {
                    this.removeListener('response', handler);

                    return reject(new Error(result[0].Message));
                }

                if (!result[0].Message || !result[0].Message.includes('follow')) {
                    this.removeListener('response', handler);

                    return resolve(result[0]);
                }

                if (result[result.length - 1].ListItems) {
                    const first = result.shift();
                    const last = result.pop();

                    const temp: any = {
                        Response: first.Response,
                        Message: first.Message,
                        ActionID: first.ActionID,
                        List: result,
                        ListItems: parseInt(last.ListItems)
                    };

                    this.removeListener('response', handler);

                    return resolve(temp);
                }
            };

            this.on('response', handler);

            if (!this._socket || !this._socket?.write(_request)) {
                return reject(new Error('Could not send data to socket'));
            }
        });
    }
}

export { AsteriskManagerInterface };
