# Bridge

Bridge.sol - Contract for cross-chain token and coin transfers.

Mapper.sol - Contract responsible for managing token mappings between different chains. It supports the registration, updating, and revocation of tokens for bridging.

### Compilation

```shell
npm run compile
```

### Testing

```shell
npm run test
```

### Deployment

#### Mainnet

```shell
npm run deploy-Mapper:mainnet
```

```shell
npm run deploy-Bridge:mainnet
```

#### Nile Testnet

```shell
npm run deploy-Mapper:nile
```

```shell
npm run deploy-Bridge:nile
```

### Scripts

##### Mapper

#### Mainnet
```shell
npm run scripts-Mapper-setup:mainnet
```
#### Nile
```shell
npm run scripts-Mapper-setup:nile
```