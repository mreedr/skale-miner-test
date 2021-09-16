Define a .env
```
INFURA_ENDPOINT=<key>
RINKEBY_PK=<key>

SKALE_ENDPOINT=<key>
SKALE_PK=<key>

SKALE_DEV_IMA_RINKEBY_ABI=<key>
SKALE_DEV_CHAIN_NAME=<key>
```

then:
1. `yarn install`
2. `yarn start`

test community pool:
1. `yarn test-pool`


TroubleShooting:
`Returned error: Account balance is too low (balance < value + gas * gas price)`
- Computed Hash is incorrect

