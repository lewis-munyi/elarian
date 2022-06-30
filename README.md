# Votr
An express application that consumes [Elarian](https://elarian.com)'s API. This solution was presented as a mvp on an open source community [hackathon](https://community.elarian.com/events/details/africas-talking-africas-talking-community-presents-africas-talking-open-hackathon-fintech/)



## Setting Up
> CAUTION! This app is HIGHLY EXPERIMENTAL. Expect bugs.

Get auth credentials from [elarian](https://dashboard.elarian.com/en/providers/setup)

create a `config/default.json` file with the the following code:

```
{
    "port": 3000,

    "elarian": {
        "client": {
            "appId": "XXXXX",
            "orgId": "el_og_XXXXXXX",
            "apiKey": "el_api_key_XXXXXXXX"
        },

        "channel": {
            "purseId": "el_prs-XXXXX",

            "sms": {
                "channel": "sms",
                "number": "XXXXX"
            },

            "paybill": {
                "channel": "cellular",
                "number": "XXXXXX"
            }
        }
    }
}
```

Run `npm install`

Run `node index.js`

## Contribution
Pull requests are currently being accepted. Fix any issues you might find.