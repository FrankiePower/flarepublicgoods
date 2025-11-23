# Flare Public Goods

A decentralized public goods funding platform built on Flare Network. Users deposit USDC to support open-source projects and community initiatives. The deposits generate yield through DeFi lending strategies (Morpho Blue and Kinetic Markets), and all generated yield is automatically allocated to fund public goods. Your principal remains safe and fully withdrawable at any time.

## How It Works

1. **Deposit USDC**: Users contribute USDC to the funding pool
2. **Generate Yield**: Deposits earn yield through secure DeFi lending protocols
3. **Automatic Allocation**: All generated yield is allocated to public goods recipients
4. **No Loss**: Your principal is always safe and can be withdrawn anytime
5. **Fair Distribution**: Recipients are selected using Flare's secure VRF (Verifiable Random Function) with time-weighted probability

## Project Structure

- `/packages/foundry`: Solidity smart contracts, tests, and deployment scripts
- `/src`: React + TypeScript + Vite frontend application

## Prerequisites

- [**Node.js**](https://nodejs.org/en/) (v18 or later)
- [**Foundry**](https://getfoundry.sh/): Ethereum development toolkit

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository_url>
cd flarepublicgoods
```

### 2. Install Dependencies

Install frontend dependencies:

```bash
npm install
```

Install smart contract dependencies:

```bash
cd packages/foundry
forge install
```

### 3. Set Up Environment Variables

Create a `.env` file in the `packages/foundry` directory:

```bash
# In packages/foundry/.env
PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

**Note**: Your private key should not have a `0x` prefix.

## Development

### Running the Frontend

To start the local development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Testing the Smart Contract

To run the Solidity test suite:

```bash
cd packages/foundry
forge test
```

## Deployment

### Deploy to Flare Testnet (Coston2)

Flare Coston2 is the primary testnet for this project.

1. **Get testnet tokens**: Fund your wallet with C2FLR from the [Coston2 faucet](https://faucet.flare.network/)

2. **Export your private key**:
   ```bash
   export PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ```

3. **Deploy the contracts**:
   ```bash
   forge script packages/foundry/script/DeployFlarePublicGoods.s.sol:DeployFlarePublicGoods \
     --rpc-url coston2 \
     --broadcast \
     --legacy
   ```

4. **Verify on Blockscout** (optional):
   ```bash
   forge verify-contract --chain 114 --etherscan-api-key unused \
     --verifier blockscout --verifier-url https://coston2-explorer.flare.network/api \
     <DEPLOYED_ADDRESS> packages/foundry/src/FlarePublicGoods.sol:FlarePublicGoods
   ```

5. **Update the frontend**:
   - Add deployed addresses to `src/contracts/FlarePublicGoods.ts` under key `114`
   - The UI will automatically recognize Coston2 and use the correct explorer links

### Flare Network Information

- **RPC (HTTP)**: `https://coston2-api.flare.network/ext/C/rpc`
- **Chain ID**: 114
- **Explorer**: `https://coston2-explorer.flare.network`
- **Randomness**: Flare Secure VRF (Verifiable Random Function)

## Architecture

### Smart Contracts

- **FlarePublicGoods.sol**: Main contract managing deposits, yield generation, and fund allocation
- **FlareSecureRandomAdapter.sol**: Integration with Flare's secure VRF for fair recipient selection
- **KineticAdapter.sol**: Yield generation adapter for Kinetic Markets
- **Morpho4626Adapter.sol**: Yield generation adapter for Morpho Blue

### Frontend

- React 18.3 + TypeScript
- Vite for fast development and builds
- Wagmi 2.16 + RainbowKit 2.1 for Web3 integration
- Tailwind CSS + Framer Motion for UI
- Multi-chain support (Coston2, Sepolia, Flow EVM, Katana)

## Key Features

- **No-Loss Contributions**: Your principal is always safe and fully withdrawable
- **Automated Yield Generation**: Deposits automatically earn yield through DeFi lending
- **Fair Allocation**: Flare's secure VRF ensures transparent and verifiable recipient selection
- **Time-Weighted Probability**: Longer contribution periods increase allocation probability
- **Multi-Chain Support**: Deploy on multiple EVM-compatible networks
- **Real-Time Updates**: Live tracking of funding pool and allocation probability

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please open an issue on GitHub.
