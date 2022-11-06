// Copyright (c) 2016-2022 Brandon Lehmann
//
// Please see the included LICENSE file for more information.

import { createConnection, Socket } from 'net';
import { EventEmitter } from 'events';
import { v4 } from 'uuid';
import { AMI } from './types';
import PayloadManager from './payload-manager';
export { AMI };

export const cleanupStatus = (elem: any): any => {
    elem.Time = -1;
    elem.Online = false;

    if (typeof elem.Status === 'undefined') {
        elem.Status = 'UNKNOWN';
    } else if (elem.Status.toUpperCase().includes('OK')) {
        if (elem.Status.includes('ms')) {
            elem.Time = parseInt(elem.Status.split('(')[1].split(' ms')[0]);
        }
        elem.Online = true;
        elem.Status = elem.Status.split(' ')[0];
    }

    return elem;
};

interface OptionalOptions {
    host: string;
    port: number;
    defaultMaxListeners: number;
}

interface RequiredOptions {
    user: string;
    password: string;
}

interface AMIConnectionOptions extends Partial<OptionalOptions>, RequiredOptions {}
interface AMIConnectionOptionsFinal extends OptionalOptions, RequiredOptions {}

export default class AsteriskManagerInterface extends EventEmitter {
    private _socket?: Socket;
    private _payloadManager = new PayloadManager();
    private options: AMIConnectionOptionsFinal;
    private _authenticated = false;

    /**
     * Constructs a new instance of AMI connection
     * @param options
     */
    constructor (options: AMIConnectionOptions) {
        super();

        options.host ||= '127.0.0.1';
        options.port ||= 5038;
        options.defaultMaxListeners ||= 20;

        this.options = options as any;

        this.setMaxListeners(this.options.defaultMaxListeners);

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
     * Closes the connection to the server
     */
    public async close (): Promise<void> {
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

        const response = await this.send<AMI.Login>({
            Action: 'Login',
            Username: user,
            Secret: password,
            Events: 'off'
        });

        if (response.Response === 'Success') {
            this._authenticated = true;

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
    public async send<ResponseType extends AMI.AMIPayload = any,
        RequestType extends AMI.AMIRequest = any> (
        payload: RequestType
    ): Promise<ResponseType> {
        return this.write(payload);
    }

    /**
     * Initializes our socket by creating a connection
     *
     * @private
     */
    private async init () {
        await this.close();

        this._payloadManager.start();

        this._socket = createConnection(this.options.port, this.options.host);
        this._socket.setKeepAlive(true);
        this._socket.setNoDelay(true);

        this._socket.on('close', (hadError: boolean) => this.emit('close', hadError));

        this._socket.once('data', data => {
            if (data.toString().includes('Asterisk Call Manager')) {
                this.emit('connect');
            }
        });

        this._socket.on('data', data => this._payloadManager.incoming(data));
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
        if (!this._socket?.destroyed) {
            await this.init();
        }
    }

    /**
     * Attempts to send an AMI command and await the reply
     *
     * @param payload
     * @private
     */
    private async write<ResponseType extends AMI.AMIPayload = any,
        RequestType extends AMI.AMIRequest = any> (
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
