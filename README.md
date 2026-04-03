# Asterisk Manager Interface

[![NPM](https://img.shields.io/npm/v/@gibme/asterisk-manager-interface)](https://www.npmjs.com/package/@gibme/asterisk-manager-interface)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TypeScript client library for the [Asterisk Manager Interface (AMI)](https://wiki.asterisk.org/wiki/pages/viewpage.action?pageId=4817239) with automatic reconnection, keep-alive support, and typed responses for common AMI actions.

## Requirements

- Node.js >= 22

## Installation

```bash
yarn add @gibme/asterisk-manager-interface
# or
npm install @gibme/asterisk-manager-interface
```

## Documentation

Full API documentation is available at [https://gibme-npm.github.io/asterisk-manager-interface/](https://gibme-npm.github.io/asterisk-manager-interface/)

## Quick Start

```typescript
import AMI from '@gibme/asterisk-manager-interface';

const ami = new AMI({
    user: 'amiuser',
    password: 'amipassword',
    host: '127.0.0.1'
});

await ami.login();

// Ping the server
await ami.ping();

// List active channels
const channels = await ami.channels();

// Detect available channel drivers
const hasPJSIP = await ami.has_chan_pjsip();
const hasSIP = await ami.has_chan_sip();
const hasIAX2 = await ami.has_chan_iax2();

// Query PJSIP endpoints
if (hasPJSIP) {
    const endpoints = await ami.pjsip_endpoints();
    const contacts = await ami.pjsip_contacts();
}

// Send any arbitrary AMI action
const response = await ami.send({ Action: 'Status' });

await ami.close();
```

## Constructor Options

| Option | Type | Default | Description |
|---|---|---|---|
| `user` | `string` | — | AMI username (required) |
| `password` | `string` | — | AMI password (required) |
| `host` | `string` | `'127.0.0.1'` | AMI server hostname or IP |
| `port` | `number` | `5038` | AMI server port |
| `autoReconnect` | `boolean` | `true` | Automatically reconnect on disconnect |
| `keepAlive` | `boolean` | `true` | Send periodic ping commands |
| `keepAliveInterval` | `number` | `30000` | Keep-alive ping interval (ms) |
| `connectionTimeout` | `number` | `5000` | Socket connection timeout (ms) |
| `readInterval` | `number` | `500` | Payload read interval (ms) |

## API

### Connection

- **`login(user?, password?)`** — Authenticate with the AMI server
- **`close()`** — Close the connection and clean up
- **`ping()`** — Send a keep-alive ping
- **`authenticated`** — Whether the client is currently authenticated

### Channel Driver Detection

- **`has_chan_sip()`** — Check if `chan_sip` is loaded
- **`has_chan_pjsip()`** — Check if `chan_pjsip` is loaded
- **`has_chan_iax2()`** — Check if `chan_iax2` is loaded
- **`moduleCheck(module)`** — Check if any Asterisk module is loaded

### Peer & Endpoint Discovery

- **`sip_peers()`** — List SIP peers
- **`pjsip_endpoints()`** — List PJSIP endpoints
- **`pjsip_contacts()`** — List PJSIP contacts
- **`iax2_peers()`** — List IAX2 peers
- **`channels()`** — List active channels

### Asterisk Database

- **`db_get(family, key)`** — Retrieve a database entry
- **`db_get_tree(family?, key?)`** — Retrieve a database tree
- **`db_put(family, key, value)`** — Store a database entry
- **`db_del(family, key)`** — Delete a database entry
- **`db_del_tree(family, key)`** — Delete a database tree

### Generic Commands

- **`send<ResponseType, RequestType>(payload)`** — Send any AMI action and await a typed response. Automatically handles authentication if not already logged in.

## Events

The client extends `EventEmitter` and emits:

| Event | Payload | Description |
|---|---|---|
| `connect` | — | Socket connected to the server |
| `close` | `hadError?: boolean` | Socket closed |
| `error` | `Error` | Connection error |
| `response` | `T` | AMI response packet received |

## License

MIT
