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

export namespace AMI {
    export interface AMIPayload {
        Response: string;
        Message?: string;
        ActionID: string;

        [key: string]: any;
    }

    export interface AMIPayloadWithList<Type> extends AMIPayload {
        List: Type[];
        ListItems: number;
    }

    export interface AMIRequest {
        Action: string;

        [key: string]: any;
    }

    export type Login = AMIPayload

    export interface Pong extends AMIPayload {
        Ping: string;
        Timestamp: string;
    }

    export interface PJSIPEndpointEntry {
        ObjectType: string;
        ObjectName: string;
        Transport: string;
        Aor: number;
        Auths: string;
        OutboundAuths: string;
        Contacts: string;
        DeviceState: string;
        ActiveChannels: string;
    }

    export type PJSIPShowEndpoints = AMIPayloadWithList<PJSIPEndpointEntry>;

    export interface PJSIPContactEntry {
        ObjectType: string;
        ObjectName: string;
        ViaAddr: string;
        QualifyTimeout: number;
        CallId: string;
        RegServer: string;
        PruneOnBoot: boolean;
        Path: string;
        Endpoint: string;
        ViaPort: number;
        AuthenticateQualify: boolean;
        Uri: string;
        QualifyFrequency: number;
        UserAgent: string;
        ExpirationTime: string;
        OutboundProxy: string;
        Status: string;
        RoundtripUsec: number;
    }

    export type PJSIPShowContacts = AMIPayloadWithList<PJSIPContactEntry>

    export interface SIPpeersEntry {
        Channeltype: string;
        ObjectName: string;
        ChanObjectType: string;
        IPaddress: string;
        IPport: number;
        Dynamic: boolean;
        AutoForcerport: boolean;
        Forcerport: boolean;
        AutoComedia: boolean;
        Comedia: boolean;
        VideoSupport: boolean;
        TextSupport: boolean;
        ACL: boolean;
        Status: string;
        Time: number;
        RealtimeDevice: boolean;
        Description: string;
        Accoundcode: string;
        Online: boolean;
    }

    export type SIPpeers = AMIPayloadWithList<SIPpeersEntry>

    export interface IAXpeerlistEntry {
        Channeltype: string;
        ObjectName: string;
        ChanObjectType: string;
        IPaddress: string;
        Mask: string;
        Port: number;
        Dynamic: boolean;
        Trunk: boolean;
        Encryption: boolean;
        Status: string;
        Time: number;
        Online: boolean;
    }

    export type IAXpeerlist = AMIPayloadWithList<IAXpeerlistEntry>;
}
