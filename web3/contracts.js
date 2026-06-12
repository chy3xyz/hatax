// ============================================================
// 33buy — Contract addresses (BSC mainnet)
// ============================================================
// Set these via env or update before deploy:
//   TRIDAO_ADDRESS — TriDao UUPS proxy
//   PRODUCT_REGISTRY_ADDRESS — ProductRegistry
//   TRITOKEN_ADDRESS — TriToken ERC20
// ============================================================

export const ADDRESSES = {
  // USDT — stablecoin for all payments (BSC mainnet or local mock)
  usdt: import.meta.env.VITE_USDT_ADDRESS ||
        '0x55d398326f99059fF775485246999027B3197955',

  // TriDao UUPS proxy (33buy core MLM + order flow)
  triDao: import.meta.env.VITE_TRIDAO_ADDRESS ||
          '0x0000000000000000000000000000000000000000',

  // ProductRegistry — product listing + order tracking
  productRegistry: import.meta.env.VITE_PRODUCT_REGISTRY_ADDRESS ||
                   '0x0000000000000000000000000000000000000000',

  // TriToken — RWA token for 10% auto-swap reward
  triToken: import.meta.env.VITE_TRITOKEN_ADDRESS ||
            '0x0000000000000000000000000000000000000000',

  // PancakeSwap Router
  pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
}

// Default referrer for local testing / onboarding fallback.
// In production set VITE_DEFAULT_REFERRER; in dev it falls back to the Anvil owner account.
export const DEFAULT_REFERRER = import.meta.env.VITE_DEFAULT_REFERRER ||
  (import.meta.env.DEV ? '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' : '0x0000000000000000000000000000000000000000')

// ============================================================
// ERC20 ABI (minimal — balanceOf, approve, allowance, decimals, symbol)
// ============================================================
export const ERC20_ABI = [
  { type:'function', name:'balanceOf', inputs:[{name:'account',type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'allowance', inputs:[{name:'owner',type:'address'},{name:'spender',type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'approve', inputs:[{name:'spender',type:'address'},{name:'amount',type:'uint256'}], outputs:[{type:'bool'}], stateMutability:'nonpayable' },
  { type:'function', name:'decimals', inputs:[], outputs:[{type:'uint8'}], stateMutability:'view' },
  { type:'function', name:'symbol', inputs:[], outputs:[{type:'string'}], stateMutability:'view' },
]

// ============================================================
// TriDao ABI — 33buy core contract
// ============================================================
export const TRIDAO_ABI = [
  // ── Write ──
  {
    type: 'function', name: 'bind',
    inputs: [{ name: 'referrer', type: 'address' }],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'placeOrder',
    inputs: [
      { name: '_productId', type: 'uint256' },
      { name: '_orderRef', type: 'bytes32' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'setInviter',
    inputs: [
      { name: '_u', type: 'address' },
      { name: '_inviter', type: 'address' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ── Read ──
  {
    type: 'function', name: 'userMap',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'active', type: 'bool' },
      { name: 'referrer', type: 'address' },
      { name: 'teamNum', type: 'uint256' },
      { name: 'subNum', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'teamAmount', type: 'uint256' },
      { name: 'grade', type: 'uint256' },
      { name: 'directVolume', type: 'uint256' },
      { name: 'levelOneMatches', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'upgradePrice',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'checkUpgrade',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'checkReciver',
    inputs: [{ name: '_player', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getReferrer',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'address' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getSubordinates',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'address[]' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getSubNum',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getAccountActive',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getAccountGrade',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getAccountValid',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getUsersNum',
    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getValidNum',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getDirectLength',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getTeamAmount',
    inputs: [{ name: '_account', type: 'address' }],
    outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'inviter',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'address' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'blackhouse',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'bindStatus',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'bool' }], stateMutability: 'view',
  },

  // ── Events ──
  {
    type: 'event', name: 'OrderPlaced',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'level', type: 'uint256' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'productId', type: 'uint256' },
      { indexed: false, name: 'orderRef', type: 'bytes32' },
    ],
  },
  {
    type: 'event', name: 'BindRelationship',
    inputs: [
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'referrer', type: 'address' },
    ],
  },
  {
    type: 'event', name: 'UpgradeLog',
    inputs: [
      { indexed: true, name: 'account', type: 'address' },
      { indexed: false, name: 'level', type: 'uint256' },
      { indexed: false, name: 'reward', type: 'uint256' },
      { indexed: true, name: 'reciver', type: 'address' },
    ],
  },
]

// ============================================================
// ProductRegistry ABI
// ============================================================
export const PRODUCT_REGISTRY_ABI = [
  // ── Write ──
  {
    type: 'function', name: 'registerProduct',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_imageUrl', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_price', type: 'uint256' },
      { name: '_supplierWallet', type: 'address' },
      { name: '_supplierName', type: 'string' },
    ],
    outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'setProductActive',
    inputs: [
      { name: '_productId', type: 'uint256' },
      { name: '_active', type: 'bool' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'updateOrderStatus',
    inputs: [
      { name: '_orderId', type: 'uint256' },
      { name: '_status', type: 'uint8' },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },

  // ── Read ──
  {
    type: 'function', name: 'productCount',
    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getProduct',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'name', type: 'string' },
      { name: 'imageUrl', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'price', type: 'uint256' },
      { name: 'supplierWallet', type: 'address' },
      { name: 'supplierName', type: 'string' },
      { name: 'active', type: 'bool' },
      { name: 'createdAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'getProducts',
    inputs: [
      { name: '_start', type: 'uint256' },
      { name: '_count', type: 'uint256' },
    ],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'name', type: 'string' },
        { name: 'imageUrl', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'price', type: 'uint256' },
        { name: 'supplierWallet', type: 'address' },
        { name: 'supplierName', type: 'string' },
        { name: 'active', type: 'bool' },
        { name: 'createdAt', type: 'uint256' },
      ],
    }],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'orderCount',
    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },
  {
    type: 'function', name: 'getOrder',
    inputs: [{ name: '_id', type: 'uint256' }],
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'productId', type: 'uint256' },
      { name: 'buyer', type: 'address' },
      { name: 'orderRef', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function', name: 'listingFee',
    inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view',
  },

  // ── Events ──
  {
    type: 'event', name: 'ProductRegistered',
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: true, name: 'supplier', type: 'address' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
  },
  {
    type: 'event', name: 'OrderCreated',
    inputs: [
      { indexed: true, name: 'id', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'productId', type: 'uint256' },
      { indexed: false, name: 'orderRef', type: 'bytes32' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
  },
]

// ============================================================
// DEPRECATED — old ABIs for legacy pages
// ============================================================
export const MINTER_ABI = [
  { type:'function', name:'deposit', inputs:[{name:'amount',type:'uint256'}], outputs:[], stateMutability:'nonpayable' },
  { type:'function', name:'pending', inputs:[{name:'_user',type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
]
export const MINGS_ABI = [
  { type:'function', name:'deposit', inputs:[{name:'amount',type:'uint256'}], outputs:[], stateMutability:'nonpayable' },
  { type:'function', name:'pending', inputs:[{name:'',type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
]
export const GRADE_ABI = [
  { type:'function', name:'pendingStar', inputs:[{name:'',type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
]
export const ATC10_ABI = [
  { type:'function', name:'withdraw2', inputs:[], outputs:[], stateMutability:'nonpayable' },
]
export const REWARD_ABI = [
  { type:'function', name:'getReds', inputs:[], outputs:[{type:'tuple[]', components:[{name:'id',type:'uint256'},{name:'redNum',type:'uint256'},{name:'redReceivedNum',type:'uint256'},{name:'amount',type:'uint256'},{name:'time',type:'uint256'}]}], stateMutability:'view' },
]
export const NFTSALE_ABI = [
  { type:'function', name:'buyNFT', inputs:[{name:'inviter',type:'address'},{name:'num',type:'uint256'},{name:'useCoupon',type:'bool'}], outputs:[], stateMutability:'nonpayable' },
]
