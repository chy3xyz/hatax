import { createPublicClient, createWalletClient, custom, http, formatEther, parseEther, parseUnits } from 'viem'
import { bsc, hardhat, localhost } from 'viem/chains'
import { CHAIN_CONFIG, DEFAULT_CHAIN } from './config.js'

let publicClient = null
let walletClient = null
let currentChain = DEFAULT_CHAIN

export function getPublicClient(chain = currentChain) {
  if (!publicClient || publicClient.chain.id !== chain.id) {
    // Use project config RPC (PublicNode) instead of viem built-in thirdweb RPC
    const rpcUrl = CHAIN_CONFIG[chain.id === 56 ? 'bsc' : chain.id === 31337 ? 'hardhat' : 'localhost']?.rpcUrl
      || chain.rpcUrls?.default?.http?.[0]
      || 'https://bsc-rpc.publicnode.com'
    publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })
  }
  return publicClient
}

export function getWalletClient(chain = currentChain) {
  if (typeof window === 'undefined' || !window.ethereum) return null
  if (!walletClient || walletClient.chain.id !== chain.id) {
    walletClient = createWalletClient({
      chain,
      transport: custom(window.ethereum),
    })
  }
  return walletClient
}

export function setCurrentChain(chain) {
  currentChain = chain
  publicClient = null
  walletClient = null
}

export function getCurrentChain() {
  return currentChain
}

export { formatEther, parseEther, parseUnits, bsc, hardhat, localhost }
