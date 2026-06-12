import { getPublicClient, getWalletClient, getCurrentChain, setCurrentChain, bsc, hardhat, localhost, formatEther, parseEther } from './client.js'
import { ADDRESSES, ERC20_ABI, TRIDAO_ABI, PRODUCT_REGISTRY_ABI, MINTER_ABI, MINGS_ABI, GRADE_ABI, ATC10_ABI, REWARD_ABI, NFTSALE_ABI } from './contracts.js'
import { CHAIN_CONFIG, DEFAULT_CHAIN } from './config.js'
export const MAX_APPROVE = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

let _address = null

const CHAIN_MAP = { [bsc.id]: bsc, [hardhat.id]: hardhat, [localhost.id]: localhost }
const CHAIN_KEY_MAP = { [bsc.id]: 'bsc', [hardhat.id]: 'hardhat', [localhost.id]: 'localhost' }

export function getChainDisplayName(chain) {
  const key = CHAIN_KEY_MAP[chain.id]
  return (key && CHAIN_CONFIG[key]?.name) || chain.name
}

export function getAddress() {
  return _address || localStorage.getItem('hatax_wallet_address')
}

export function setAddress(addr) {
  _address = addr ? addr.toLowerCase() : null
  if (addr) localStorage.setItem('hatax_wallet_address', _address)
  else localStorage.removeItem('hatax_wallet_address')
}

export async function syncChainFromWallet() {
  if (!window.ethereum) return
  try {
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
    const chainId = parseInt(chainIdHex, 16)
    const chain = CHAIN_MAP[chainId] || DEFAULT_CHAIN
    const prev = getCurrentChain()
    setCurrentChain(chain)
    if (prev.id !== chain.id) {
      window.dispatchEvent(new CustomEvent('wallet-chain-changed', { detail: { ...chain, displayName: getChainDisplayName(chain), prevId: prev.id } }))
      console.log('[chain] synced:', getChainDisplayName(chain), 'id:', chain.id)
    }
  } catch (e) {
    console.error('syncChainFromWallet:', e)
  }
}

function _onChainChanged(chainIdHex) {
  console.log('[wallet] chainChanged', chainIdHex)
  const chainId = parseInt(chainIdHex, 16)
  const chain = CHAIN_MAP[chainId]
  const prev = getCurrentChain()
  if (chain && prev.id !== chain.id) {
    setCurrentChain(chain)
    window.dispatchEvent(new CustomEvent('wallet-chain-changed', { detail: { ...chain, displayName: getChainDisplayName(chain), prevId: prev.id } }))
  }
}

function _onAccountsChanged(accounts) {
  console.log('[wallet] accountsChanged', accounts)
  const addr = accounts && accounts.length > 0 ? accounts[0].toLowerCase() : null
  setAddress(addr)
  window.dispatchEvent(new CustomEvent('wallet-account-changed', { detail: addr }))
  if (addr) syncChainFromWallet().catch(() => {})
}

let _walletListenersAttached = false

async function syncAccountFromWallet() {
  if (typeof window === 'undefined' || !window.ethereum) return
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    const addr = accounts && accounts.length > 0 ? accounts[0].toLowerCase() : null
    const stored = getAddress()
    if (addr !== stored) {
      console.log('[wallet] syncAccountFromWallet', addr, 'stored:', stored)
      setAddress(addr)
      window.dispatchEvent(new CustomEvent('wallet-account-changed', { detail: addr }))
    }
  } catch(e) {
    console.error('[wallet] syncAccountFromWallet failed', e)
  }
}

function attachWalletListeners() {
  if (typeof window === 'undefined' || !window.ethereum || _walletListenersAttached) return false
  try {
    window.ethereum.on('chainChanged', _onChainChanged)
    window.ethereum.on('accountsChanged', _onAccountsChanged)
    _walletListenersAttached = true
    console.log('[wallet] listeners attached', window.ethereum.isMetaMask ? '(MetaMask)' : '')
    // Sync current account immediately in case it changed before listeners were attached
    syncAccountFromWallet()
    return true
  } catch(e) {
    console.error('[wallet] attach listeners failed', e)
    return false
  }
}

// Try immediately if provider is already injected
attachWalletListeners()

// Some wallets (MetaMask sometimes, Rainbow, etc.) inject window.ethereum after page load.
// Listen for the standard detection event and retry.
if (typeof window !== 'undefined') {
  window.addEventListener('ethereum#initialized', attachWalletListeners, { once: true })
  // Fallback: retry a few times over the next couple of seconds
  let attempts = 0
  const timer = setInterval(() => {
    if (attachWalletListeners() || attempts++ >= 10) clearInterval(timer)
  }, 200)
}

export async function connectWallet() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not installed')
  }
  // Ensure listeners are attached before connecting
  attachWalletListeners()
  const walletClient = getWalletClient()
  const accounts = await walletClient.requestAddresses()
  if (!accounts || accounts.length === 0) throw new Error('No accounts')
  const address = accounts[0].toLowerCase()
  setAddress(address)

  // Sync chain from wallet instead of forcing BSC
  await syncChainFromWallet()

  return address
}

export async function disconnectWallet() {
  setAddress(null)
}

export async function readContract({ address, abi, functionName, args = [] }) {
  // Use the dapp's current chain (set/enforced by the app) instead of following
  // the wallet, so local testing doesn't accidentally switch to BSC mid-flow.
  const client = getPublicClient()
  console.log('[readContract]', functionName, 'chain:', client.chain.name, 'addr:', address)
  return client.readContract({ address, abi, functionName, args })
}

export async function writeContract({ address, abi, functionName, args = [], value }) {
  const walletClient = getWalletClient()
  const account = getAddress()
  if (!account) throw new Error('Wallet not connected')
  const { request } = await getPublicClient().simulateContract({
    address, abi, functionName, args, account, value,
  })
  return walletClient.writeContract(request)
}

export async function getTokenBalance(tokenAddress, owner) {
  const bal = await readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [owner] })
  return formatEther(bal)
}

export async function getAllowance(tokenAddress, owner, spender) {
  const all = await readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'allowance', args: [owner, spender] })
  return formatEther(all)
}

export async function approveToken(tokenAddress, spender) {
  return writeContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'approve', args: [spender, MAX_APPROVE] })
}

export async function waitForTransaction(hash) {
  const client = getPublicClient()
  return client.waitForTransactionReceipt({ hash })
}

export async function switchChain(chainKey) {
  const map = { bsc, hardhat, localhost }
  const chain = map[chainKey] || bsc
  const chainIdHex = '0x' + chain.id.toString(16)

  // No wallet: just update internal state for read-only mode
  if (!window.ethereum) {
    setCurrentChain(chain)
    window.dispatchEvent(new CustomEvent('wallet-chain-changed', { detail: { ...chain, displayName: getChainDisplayName(chain) } }))
    return
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    })
  } catch (e) {
    if (e.code === 4902 || e.code === -32603 /* some wallets return generic error */) {
      // Chain not added; try to add it
      const config = CHAIN_CONFIG[chainKey] || CHAIN_CONFIG.hardhat
      const addParams = {
        chainId: chainIdHex,
        chainName: chain.name,
        nativeCurrency: {
          name: chain.nativeCurrency.name,
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
        },
        rpcUrls: [config.rpcUrl],
        blockExplorerUrls: config.explorer ? [config.explorer] : [],
      }
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [addParams],
        })
      } catch (addErr) {
        if (addErr.code === 4001) {
          throw new Error('User rejected adding network')
        }
        throw addErr
      }
    } else if (e.code === 4001) {
      throw new Error('User rejected chain switch')
    } else {
      throw e
    }
  }

  // Sync actual chain from wallet so UI/internal state matches MetaMask.
  // This also prevents the "BSC stays selected" symptom when the switch fails.
  await syncChainFromWallet()
}

export {
  ADDRESSES, ERC20_ABI, TRIDAO_ABI, PRODUCT_REGISTRY_ABI,
  MINTER_ABI, MINGS_ABI, GRADE_ABI, ATC10_ABI, REWARD_ABI, NFTSALE_ABI,
  bsc, hardhat, localhost, formatEther, parseEther,
  getCurrentChain,
}
