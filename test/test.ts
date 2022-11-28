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

import { describe, it } from 'mocha';
import AsteriskManagerInterface from '../src/asterisk-manager-interface';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Unit Tests', async () => {
    const ami = new AsteriskManagerInterface({
        host: process.env.AMI_HOST || '127.0.0.1',
        user: process.env.AMI_USERNAME || '',
        password: process.env.AMI_PASSWORD || ''
    });

    let chan_sip = false;
    let chan_pjsip = false;
    let chan_iax2 = false;

    before(async () => {
        try {
            await ami.login();
        } catch {}
    });

    after(async () => {
        await ami.close();
    });

    describe('Basic Tests', async () => {
        it('Ping', async function () {
            if (!ami.authenticated) {
                return this.skip();
            }

            await ami.ping();
        });

        it('Detect chan_sip', async function () {
            if (!ami.authenticated) {
                return this.skip();
            }

            chan_sip = await ami.moduleCheck('chan_sip');
        });

        it('Detect chan_pjsip', async function () {
            if (!ami.authenticated) {
                return this.skip();
            }

            chan_pjsip = await ami.moduleCheck('chan_pjsip');
        });

        it('Detect chan_iax2', async function () {
            if (!ami.authenticated) {
                return this.skip();
            }

            chan_iax2 = await ami.moduleCheck('chan_iax2');
        });
    });

    describe('chan_sip Tests', async () => {
        it('Peers', async function () {
            if (!chan_sip) {
                return this.skip();
            }

            await ami.send({
                Action: 'SIPpeers'
            });
        });
    });

    describe('chan_pjsip Tests', async () => {
        it('Endpoints', async function () {
            if (!chan_pjsip) {
                return this.skip();
            }

            await ami.send({
                Action: 'PJSIPShowEndpoints'
            });
        });

        it('Contacts', async function () {
            if (!chan_pjsip) {
                return this.skip();
            }

            await ami.send({
                Action: 'PJSIPShowContacts'
            });
        });
    });

    describe('chan_iax2 Tests', async () => {
        it('Peers', async function () {
            if (!chan_iax2) {
                return this.skip();
            }

            await ami.send({
                Action: 'IAXpeerlist'
            });
        });
    });
});
