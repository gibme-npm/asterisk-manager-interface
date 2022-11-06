// Copyright (c) 2016-2022 Brandon Lehmann
//
// Please see the included LICENSE file for more information.

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

    interface PJSIPEndpointEntry {
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

    interface PJSIPContactEntry {
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

    interface SIPpeersEntry {
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

    interface IAXpeerlistEntry {
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
