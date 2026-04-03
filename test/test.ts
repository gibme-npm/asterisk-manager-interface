// Copyright (c) 2016-2025, Brandon Lehmann <brandonlehmann@gmail.com>
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

import { describe, it, before, after } from 'node:test';
import AsteriskManagerInterface from '../src';
import { config } from 'dotenv';

config();

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
        it('Ping', { skip: false }, async (t) => {
            if (!ami.authenticated) {
                return t.skip('Not authenticated');
            }

            await ami.ping();
        });

        it('Detect chan_sip', { skip: false }, async (t) => {
            if (!ami.authenticated) {
                return t.skip('Not authenticated');
            }

            chan_sip = await ami.has_chan_sip();
        });

        it('Detect chan_pjsip', { skip: false }, async (t) => {
            if (!ami.authenticated) {
                return t.skip('Not authenticated');
            }

            chan_pjsip = await ami.has_chan_pjsip();
        });

        it('Detect chan_iax2', { skip: false }, async (t) => {
            if (!ami.authenticated) {
                return t.skip('Not authenticated');
            }

            chan_iax2 = await ami.has_chan_iax2();
        });
    });

    describe('chan_sip Tests', async () => {
        it('Peers', { skip: false }, async (t) => {
            if (!chan_sip) {
                return t.skip('chan_sip not available');
            }

            await ami.sip_peers();
        });
    });

    describe('chan_pjsip Tests', async () => {
        it('Endpoints', { skip: false }, async (t) => {
            if (!chan_pjsip) {
                return t.skip('chan_pjsip not available');
            }

            await ami.pjsip_endpoints();
        });

        it('Contacts', { skip: false }, async (t) => {
            if (!chan_pjsip) {
                return t.skip('chan_pjsip not available');
            }

            await ami.pjsip_contacts();
        });
    });

    describe('chan_iax2 Tests', async () => {
        it('Peers', { skip: false }, async (t) => {
            if (!chan_iax2) {
                return t.skip('chan_iax2 not available');
            }

            await ami.iax2_peers();
        });
    });

    describe('Core Tests', async () => {
        it('Channels', { skip: false }, async (t) => {
            if (!ami.authenticated) {
                return t.skip('Not authenticated');
            }

            await ami.channels();
        });
    });
});
