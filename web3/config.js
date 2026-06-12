import { bsc, hardhat, localhost } from 'viem/chains'

export const SUPPORTED_CHAINS = [bsc, hardhat, localhost]

export const CHAIN_CONFIG = {
  bsc: {
    id: 56,
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-rpc.publicnode.com',
    explorer: 'https://bscscan.com',
  },
  hardhat: {
    id: 31337,
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
  },
  localhost: {
    id: 1337,
    name: 'Local EVM',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: '',
  },
}

// Default to local Anvil/Hardhat chain (chainId 31337) for now.
// BSC will be enabled later.
export const DEFAULT_CHAIN = hardhat
