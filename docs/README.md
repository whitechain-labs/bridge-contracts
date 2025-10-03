<div align="center">
  <a href="https://whitechain.io/">
    <img alt="Whitechain" style="width: 20%" src="https://whitechain.io/logo.svg"/>
  </a>

  <h1>Whitechain Bridge</h1>

  <p>
    <strong>Cross-chain bridge for the Whitechain Network</strong>
  </p>
</div>

## Overview

The Whitechain Bridge is a cross-chain bridge solution that enables secure token and coin transfers between Whitechain and other blockchain networks. This repository contains smart contracts for EVM-compatible networks, implementing a robust bridge architecture with advanced security features.

## Architecture

The bridge solution consists of two main smart contracts:

- **Mapper Smart Contract**: Manages token mappings between different chains
- **Bridge Smart Contract**: Handles cross-chain token and coin transfers

## High-Level Flow

### Mapper Smart Contract
- Extends the Ownable interface and exposes a method `addToken` that can be used only by the `owner`
- Whitechain team uses a private key that belongs to the `owner` of the smart contract to set all required tokens via calling the `addToken` method

### Bridge Smart Contract
- A user navigates to the bridging screen in Whitechain Wallet to perform a bridge operation, selects the desired chains and tokens, and their amount
- Whitechain Wallet collects all selected data and makes a request to the backend, where this data is used to create a message and sign it with a dedicated private key
- The signed message is returned to the wallet, and the user signs a transaction to the Bridge Smart Contract
- Bridge Smart Contract exposes the `bridgeTokens` method, which is executed
- The `bridgeTokens` method checks the signature and compares it with the `owner` value
- The `bridgeTokens` method checks that selected bridge operation is valid against tokens config set in the Mapper smart contract
- After all validations, the `bridgeTokens` method emits an event `Deposit`
- Whitechain Bridge backend is listening for the `Deposit` event from the `Bridge` smart contract on the origin chain and stores information about the bridging operation in a database
- Whitechain Bridge backend executes the `receiveTokens` method of the `Bridge` smart contract on the target chain
- `receiveTokens` uses `onlyOwner` modifier to check that the transaction is executed by our backend with a dedicated private key
- `receiveTokens` sends tokens/coin to the address specified by a user and emits `Withdrawal`
- Whitechain Bridge backend is listening for the `Withdrawal` event from the `Bridge` smart contract and updates information in a database that the bridging operation is completed

## Project Structure

```
bridge-contracts/
├── ether/                  # Ethereum network contracts
│   ├── contracts/          # Solidity contracts
│   │   ├── main/           # Production contracts
│   │   └── tests/          # Test contracts
│   ├── test/               # TypeScript tests
│   ├── scripts/            # Deployment and utility scripts
│   ├── docs/               # Generated documentation
│   └── ignition/           # Hardhat Ignition deployment configs
├── tron/                   # Tron network contracts
│   ├── contracts/          # Solidity contracts
│   │   ├── main/           # Production contracts
│   └── test/               # TypeScript tests
└── docs/                   # Tron network contracts
    ├── README.md           # Whitechain Bridge high-level overview
```

## Key Features

### Security Features
- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
- **Signature Validation**: ECDSA signature verification for all bridge operations
- **Replay Attack Prevention**: Tracks used message hashes

### Token Management
- **Cross-chain Token Mapping**: Supports token mappings between different chains
- **Lock/Burn and Unlock/Mint**: Flexible token handling mechanisms
- **Native Coin Support**: Handles both ERC20 tokens and native coins
- **Configurable Transfer Methods**: Supports both direct transfer and safe transfer methods

### Upgradeability
- **UUPS Proxy Pattern**: All contracts are upgradeable using OpenZeppelin's UUPS pattern
- **Storage Gap**: Reserved storage slots for future upgrades
- **Ownership Transfer**: Secure ownership transfer mechanisms

## Smart Contracts

### Bridge Contract
The main contract for cross-chain token transfers with the following key features:
- Cross-chain token and coin transfers
- ECDSA signature validation
- Gas fee accumulation
- Event emission for backend monitoring

### Mapper Contract
Manages token mappings between chains with:
- Token registration and configuration
- Deposit and withdrawal type management
- Chain-specific token address mapping
- Token validation for bridge operations

## Networks Supported

### Ethereum
- **Mainnet**: Production Ethereum network
- **Sepolia**: Sepolia testnet
- **Localhost**: Local development network

### Whitechain
- **Mainnet**: Production Whitechain network
- **Testnet**: Whitechain testnet
- **Devnet**: Whitechain development network

### Tron
- **Mainnet**: Production Tron network
- **Nile**: Nile testnet

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Hardhat (for Ethereum contracts)
- Tronbox (for Tron contracts)

## Installation

#### Ethereum Contracts
```bash
cd ether
npm install
```

#### Tron Contracts
```bash
cd tron
npm install
```

## Development

#### Compilation
```bash
cd ether
npm run compile

cd tron
npm run compile
```

#### Testing
```bash
cd ether
npm run test

cd tron
npm run test
```

#### Code Quality
```bash
cd ether
npm run prettier
npm run solhint
```

## Deployment

#### Ethereum Networks

**Localhost:**
```bash
cd ether
npm run deploy-Mapper:localhost
npm run deploy-Bridge:localhost
```

**Mainnet:**
```bash
cd ether
npm run deploy-Mapper:mainnet
npm run deploy-Bridge:mainnet
```

**Sepolia Testnet:**
```bash
cd ether
npm run deploy-Mapper:sepolia
npm run deploy-Bridge:sepolia
```

**Whitechain:**
```bash
cd ether
npm run deploy-Mapper:whitechain
npm run deploy-Bridge:whitechain
```

**Tron Mainnet:**
```bash
cd tron
npm run deploy-Mapper:mainnet
npm run deploy-Bridge:mainnet
```

**Nile Testnet:**
```bash
cd tron
npm run deploy-Mapper:nile
npm run deploy-Bridge:nile
```

### Contract Verification

#### Ethereum
```bash
npm run verify-Mapper:mainnet
npm run verify-Bridge:mainnet
```

## Setup Scripts

#### Mapper Setup
```bash
cd ether
npm run scripts-Mapper-setup:mainnet
npm run scripts-Mapper-setup:sepolia
npm run scripts-Mapper-setup:whitechain

cd tron
npm run scripts-Mapper-setup:mainnet
npm run scripts-Mapper-setup:nile
```

## Documentation

### Generate Documentation
```bash
cd ether
npm run docs
```

Documentation is generated in the `docs/` directory and includes:
- Contract interfaces and implementations
- Function documentation
- Event descriptions
- Error handling

### Key Documentation Files
- `ether/docs/main/modules/bridge/Bridge.md` - Bridge contract documentation
- `ether/docs/main/modules/mapper/Mapper.md` - Mapper contract documentation

## Testing

### Test Coverage
```bash
cd ether
npm run coverage
```

### Test Files
- `ether/test/modules/bridge/Bridge.ts` - Bridge contract tests
- `ether/test/modules/mapper/Mapper.ts` - Mapper contract tests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please refer to the documentation or create an issue in the repository.
