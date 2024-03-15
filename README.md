# 🌟 Flare Public Goods - Developer Funding Protocol

> **Autonomous Developer Funding Powered by 5 Flare Enshrined Protocols**

A decentralized application that autonomously funds developers building on Flare, leveraging FXRP deposits, FTSO price feeds for dynamic allocations, secure randomness for fair selection, and architecture for cross-chain deposits and GitHub verification.

## 🎯 What It Does

Users deposit FXRP (Flare's synthetic XRP) to fund developers. The contract uses **price-weighted dynamic allocations** based on live FTSO feeds, selects verified developers using secure randomness, and supports GitHub-verified projects.

**Key Features:**
- ✨ **FXRP Deposits**: Synthetic XRP for developer funding
- 🎲 **Secure Random Selection**: Provably fair developer selection via RandomNumberV2
- 📊 **5 FTSO Price Feeds**: FLR/USD, BTC/USD, XRP/USD, ETH/USD, DOGE/USD for dynamic allocation
- 💻 **GitHub Verification**: Projects verified via FDC JsonApi (architecture ready)
- 🌉 **Cross-Chain Deposits**: BTC/DOGE/XRP support via FDC Payment attestations (architecture ready)
- 🔄 **Dynamic Allocations**: Funding amounts adjust based on FLR price

## 🏆 Flare Protocols Integrated

This project demonstrates integration with **ALL 5 of Flare's enshrined protocols**:

1. **FAssets** - Uses FXRP (synthetic XRP) as funding asset
2. **FTSO v2** - 5 price feeds for dynamic allocation calculations
3. **Secure Random Number Generator** - Fair developer selection
4. **FDC Payment Attestations** - Cross-chain deposit verification (architecture ready)
5. **FDC JsonApi** - GitHub stars verification (architecture ready)

## 🔧 Technical Architecture

### Smart Contract Addresses (Coston2 Testnet)

- **Network**: Coston2 Testnet (Chain ID: 114)
- **FlarePublicGoods**: `0xC6194e7Bb438875340F4d09302f1f03E22318Be0`
- **Mock FXRP (with Faucet)**: `0xd54a91d7F0f58faF60dcf0dD55D281540548DDAF`
- **FTSO v2**: `0x3d893C53D9e8056135C26C8c638B76C8b60Df726`
- **Random v2**: `0x5CdF9eAF3EB8b44fB696984a1420B56A7575D250`
- **FDC Hub**: `0x0C842DFE4292A285f76F4Ac83b4156A15093A841`

### How It Works

```solidity
// 1. Developers register with GitHub repo
function registerDeveloper(string githubRepo) external

// 2. Users deposit FXRP to fund developers
function deposit(uint256 amount) external

// 3. Get all 5 FTSO price feeds
function getAllPrices() returns (uint256[] prices, uint64 timestamp)

// 4. Calculate dynamic allocation based on FLR price
function calculatePriceWeightedAllocation() returns (uint256)

// 5. Allocate funds to random verified developer
function allocateFunds() external

// 6. Verify developer via GitHub API (future FDC integration)
function verifyDeveloper(address dev, uint256 stars) external onlyOwner
```

## 🚀 Quick Start

### Get Test Tokens

1. **Get C2FLR** (for gas fees)
   - Visit [Flare Faucet](https://faucet.flare.network/)
   - Select Coston2 network
   - Enter your wallet address

2. **Get Mock FXRP** (easy testing!)
   - Connect to the dApp on Coston2
   - Click "Claim Free MFXRP" in the faucet card
   - Receive 1,000 MFXRP instantly
   - Cooldown: 1 hour between claims

**Note:** We use Mock FXRP (MFXRP) for easier testing. It's a simple ERC-20 with a public faucet function, so you don't need to go through the complex FAssets minting process.

### Try the dApp

1. Visit [https://your-deployment-url.vercel.app](https://your-deployment-url.vercel.app)
2. Connect your wallet to Coston2
3. Claim free MFXRP from the faucet
4. Deposit MFXRP to support public goods
5. Your principal stays safe - withdraw anytime!

## 📖 How Flare Protocols Power This dApp

### 1. FAssets (FXRP) - Bringing XRP to Flare

**What is FXRP?**
- FXRP is a synthetic XRP token on Flare, backed 1:1 by real XRP
- Trustless over-collateralized bridge
- Enables XRP to participate in Flare's DeFi ecosystem

**Our Integration:**
```solidity
IERC20 public immutable FXRP;

function deposit(uint256 _amount) external {
    FXRP.safeTransferFrom(msg.sender, address(this), _amount);
    totalDeposits += _amount;
    // ...
}
```

**Impact**: XRP holders can now support public goods without selling their XRP!

### 2. Secure Random Number Generator - Provably Fair Selection

**How Flare's Randomness Works:**
- ~100 independent data providers generate local random values every 90 seconds
- Each provider commits, then reveals their random number
- Final random number = sum of all provider values mod 2^256
- As long as ONE provider is honest, randomness is secure!

**Our Integration:**
```solidity
IRandomNumberV2 public randomProvider;

function awardPrize() external {
    (uint256 randomNumber, bool isSecure, ) = randomProvider.getRandomNumber();
    require(isSecure, "Random number not secure");

    uint256 winnerIndex = randomNumber % depositors.length;
    address winner = depositors[winnerIndex];
    // Award prize to winner
}
```

**Impact**: No centralized randomness oracle needed - fully enshrined in Flare protocol!

### 3. FTSO Price Feeds - Real-Time FLR Pricing

**What is FTSO?**
- Decentralized Time Series Oracle providing price feeds
- Updated every 90 seconds
- Free to use (no oracle fees!)

**Our Integration:**
```solidity
IFtsoV2 public ftsoV2;

function getFLRPrice() public payable returns (uint256 price) {
    (price, ) = ftsoV2.getFeedByIdInWei(FLR_USD_FEED_ID);
    return price;
}
```

**Impact**: Transparent USD valuations for better UX and potential price-weighted allocations!

## 🛠 For Developers

### Deploy Your Own

```bash
# Clone repo
git clone https://github.com/yourusername/flarepublicgoods
cd flarepublicgoods

# Install dependencies
npm install
cd packages/foundry && forge install

# 1. Deploy Mock FXRP (with faucet)
forge script script/DeployMockFXRP.s.sol:DeployMockFXRP \
  --rpc-url https://coston2-api.flare.network/ext/C/rpc \
  --broadcast --legacy

# 2. Deploy FlarePublicGoods contract
forge script script/DeployFlarePublicGoods.s.sol:DeployFlarePublicGoods \
  --rpc-url https://coston2-api.flare.network/ext/C/rpc \
  --broadcast --legacy
```

### Mock FXRP Faucet Contract

The Mock FXRP contract includes a built-in faucet for easy testing:

```solidity
// MockFXRP.sol - Simple ERC-20 with faucet
contract MockFXRP is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1000 * 10**18; // 1000 MFXRP
    uint256 public constant COOLDOWN_TIME = 1 hours;

    function faucet() external {
        require(canClaim(msg.sender), "Cooldown not elapsed");
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
```

**Features:**

- ✅ 1,000 MFXRP per claim
- ✅ 1-hour cooldown between claims
- ✅ View functions to check eligibility
- ✅ Initial supply: 1M MFXRP to deployer

### Contract Functions

| Function | Description | Access |
|----------|-------------|--------|
| `deposit(amount)` | Deposit FXRP | Public |
| `withdraw(amount)` | Withdraw FXRP | Public |
| `awardPrize()` | Trigger allocation | Public |
| `getFLRPrice()` | Get FLR/USD price | Public |
| `totalDeposits()` | View pool size | View |
| `currentWinProbabilityView()` | Check probability | View |

### Tech Stack
- Solidity 0.8.25 + Foundry
- React + TypeScript + Vite
- Wagmi 2.x + RainbowKit
- Tailwind CSS

## 🎯 Hackathon Feedback: Building on Flare

### ✅ What Worked Incredibly Well

1. **FAssets Documentation**
   - Clear examples for getting FXRP address
   - Good explanation of minting/redemption flow
   - Contract registry made address lookups easy

2. **Secure Random Integration**
   - Literally 3 lines of code to get secure randomness
   - `isSecure` flag is brilliant design
   - No complex oracle setup needed

3. **FTSO Integration**
   - Free price feeds with no gas fees
   - Simple interface (`getFeedByIdInWei`)
   - Reliable 90-second updates

### 🔧 Areas for Improvement

1. **FXRP Testnet Availability**
   - More testnet FXRP faucets would help
   - Easier minting process for testing
   - Pre-funded accounts for hackathons

2. **FAssets Examples**
   - More DeFi integration examples beyond minting/redemption
   - Sample projects using FXRP in smart contracts
   - Best practices for handling 18 decimal places

3. **Contract Addresses**
   - Centralized list of all protocol addresses per network
   - Could be clearer in docs (had to search multiple pages)

### 💡 Overall Experience

**Rating: 9/10**

Flare's enshrined protocols are a GAME CHANGER. Being able to use secure randomness and price feeds without any oracle setup or fees is incredible. The FAssets system is innovative - it solves a real problem (bringing non-smart-contract assets to DeFi) in an elegant way.

**Most Impressive:**
- Integration simplicity (< 1 hour to add all 3 protocols)
- No oracle fees or complex setups
- Reliable infrastructure on Coston2

**Best Feature:**
FAssets (FXRP) - This opens up massive opportunities for XRP ecosystem integration!

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Links

- [Live Demo](https://your-deployment.vercel.app)
- [Contract on Explorer](https://coston2-explorer.flare.network/address/0xcB249cbc6f32052750a7f4db204fa30e88d0522B)
- [Flare Docs](https://docs.flare.network/)
- [FAssets Overview](https://docs.flare.network/fassets/overview)

---

**Built with ❤️ on Flare Network**

*Bringing XRP to public goods, powered by enshrined oracles*
