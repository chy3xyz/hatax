
// ============================================================
// DEPRECATED — old ABIs for legacy pages (ming/mings/nft/redpacket)
// Remove when those pages are migrated to 33buy contracts
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
