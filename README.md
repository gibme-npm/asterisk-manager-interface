# [Asterisk Manager Interface](https://wiki.asterisk.org/wiki/pages/viewpage.action?pageId=4817239)

## Documentation

[https://gibme-npm.github.io/asterisk-manager-interface/](https://gibme-npm.github.io/asterisk-manager-interface/)

## Sample Code

```typescript
import AMI from '@gibme/asterisk-manager-interface';

(async () => {
    const ami = new AMI({
        user: 'amiuser',
        password: 'amipassword',
        host: 'asterisk-ip'
    });
    
    if (!await ami.login()) {
        throw new Error('Could not login');
    }
    
    console.log(await ami.moduleCheck('chan_sip'));
    
    // fetch sip peers
    console.log(await ami.send({
        Action: 'SIPpeers'
    }));
})()
```
