// Network-based contract configuration
export const CONTRACTS = {
  11155111: { // Sepolia testnet
    flarePublicGoods: '0x3cb0f6582683204d013c1bab52067ce351aa3bef',
    usdc: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    wflr: '0x0000000000000000000000000000000000000000' // Not available on Sepolia
  },
  1: { // Ethereum mainnet (Tenderly VNet)
    flarePublicGoods: '0x057992Ef2b383cFe6b0a2E4df54234B845ec9720',
    usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    wflr: '0x0000000000000000000000000000000000000000' // Not available on Ethereum
  },
  114: { // Flare testnet (Coston2)
    flarePublicGoods: '0xC6194e7Bb438875340F4d09302f1f03E22318Be0', // Multi-protocol FlarePublicGoods
    usdc: '0xCe987892D5AD2990b8279e8F76530CfF72977666',
    wflr: '0xCa839F8a3aFe95D4B8F8D5E0AE96Eab7cB90Dabb', // WFLR on Coston2
    fxrp: '0x8b4abA9C4BD7DD961659b02129beE20c6286e17F' // FXRP on Coston2
  },
  545: { // Flow EVM Testnet
    flarePublicGoods: '0x7d12dc1ec75675dafcf0e0651a6bc14a94d6e338',
    usdc: '0x2aaBea2058b5aC2D339b163C6Ab6f2b6d53aabED',
    wflr: '0x0000000000000000000000000000000000000000' // Not available on Flow
  },
} as const;

// Token info for UI
export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵'
  },
  WFLR: {
    symbol: 'WFLR',
    name: 'Wrapped Flare',
    decimals: 18,
    icon: '🔥'
  },
  FXRP: {
    symbol: 'FXRP',
    name: 'Flare XRP',
    decimals: 18,
    icon: '✨'
  }
} as const;

// Default to Flare testnet (Coston2) as primary; fallback to Sepolia, then Tenderly mainnet
export const flarePublicGoodsAddress =
  CONTRACTS[114].flarePublicGoods || CONTRACTS[11155111].flarePublicGoods || CONTRACTS[1].flarePublicGoods;

export const flarePublicGoodsAbi = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'Deposited',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'developer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'allocationNumber', type: 'uint256' }
    ],
    name: 'FundsAllocated',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'developer', type: 'address' },
      { indexed: false, internalType: 'string', name: 'githubRepo', type: 'string' }
    ],
    name: 'DeveloperRegistered',
    type: 'event'
  },
  // Read Functions - Core
  { inputs: [], name: 'FXRP', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalDeposits', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: '', type: 'address' }], name: 'depositBalances', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'nextAllocationTime', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'allocationInterval', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'lastFundedDev', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'lastAllocationAmount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'allocationCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },

  // FTSO Price Functions
  { inputs: [], name: 'getAllPrices', outputs: [{ internalType: 'uint256[]', name: 'prices', type: 'uint256[]' }, { internalType: 'uint64', name: 'timestamp', type: 'uint64' }], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'getFLRPrice', outputs: [{ internalType: 'uint256', name: 'price', type: 'uint256' }, { internalType: 'uint64', name: 'timestamp', type: 'uint64' }], stateMutability: 'payable', type: 'function' },
  { inputs: [], name: 'calculatePriceWeightedAllocation', outputs: [{ internalType: 'uint256', name: 'allocation', type: 'uint256' }], stateMutability: 'payable', type: 'function' },
  {
    inputs: [],
    name: 'allocationConfig',
    outputs: [
      { internalType: 'uint256', name: 'minPriceThreshold', type: 'uint256' },
      { internalType: 'uint256', name: 'priceMultiplier', type: 'uint256' },
      { internalType: 'bool', name: 'dynamicReallocation', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },

  // Developer Functions
  { inputs: [], name: 'getDeveloperCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getVerifiedDeveloperCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [{ internalType: 'address', name: '_dev', type: 'address' }],
    name: 'getDeveloper',
    outputs: [{
      internalType: 'tuple',
      name: '',
      type: 'tuple',
      components: [
        { internalType: 'address', name: 'wallet', type: 'address' },
        { internalType: 'string', name: 'githubRepo', type: 'string' },
        { internalType: 'uint256', name: 'totalFunded', type: 'uint256' },
        { internalType: 'uint256', name: 'githubStars', type: 'uint256' },
        { internalType: 'bool', name: 'verified', type: 'bool' },
        { internalType: 'uint256', name: 'lastFundedTimestamp', type: 'uint256' }
      ]
    }],
    stateMutability: 'view',
    type: 'function'
  },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'developerList', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },

  // Write Functions
  { inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }], name: 'deposit', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'string', name: '_githubRepo', type: 'string' }], name: 'registerDeveloper', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'allocateFunds', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ internalType: 'address', name: '_dev', type: 'address' }, { internalType: 'uint256', name: '_stars', type: 'uint256' }], name: 'verifyDeveloper', outputs: [], stateMutability: 'nonpayable', type: 'function' }
] as const;
