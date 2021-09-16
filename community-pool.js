require('dotenv').config()
let ethers = require('ethers')
const axios = require('axios')
let BN = ethers.BigNumber

// web3 = new Web3(process.env.INFURA_ENDPOINT);
let mainEthersProvider = new ethers.providers.JsonRpcProvider(process.env.INFURA_ENDPOINT)
let sklEthersProvider = new ethers.providers.JsonRpcProvider(process.env.SKALE_ENDPOINT)

let skaleOwner = new ethers.Wallet(process.env.SKALE_PK, sklEthersProvider)
let mainchainUser = new ethers.Wallet(process.env.RINKEBY_PK, mainEthersProvider)

let payerAbi = JSON.parse('[ { "inputs": [], "stateMutability": "payable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "getBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address payable", "name": "receiver", "type": "address" } ], "name": "pay", "outputs": [], "stateMutability": "payable", "type": "function" }, { "stateMutability": "payable", "type": "receive" } ]')
let payerBytecode = "0x608060405261014c806100136000396000f3fe60806040526004361061002d5760003560e01c80630c11dedd1461003657806312065fe01461007a57610034565b3661003457005b005b6100786004803603602081101561004c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506100a5565b005b34801561008657600080fd5b5061008f6100f7565b6040518082815260200191505060405180910390f35b8073ffffffffffffffffffffffffffffffffffffffff166108fc670de0b6b3a76400009081150290604051600060405180830381858888f193505050501580156100f3573d6000803e3d6000fd5b5050565b60003073ffffffffffffffffffffffffffffffffffffffff163190509056fea26469706673582212209d96fa3f8ceebc1f6b77e3efcf549b29df42a18bd96fd90b298e5391f504821e64736f6c63430007040033"


async function main() {
  let IMA_ABI = await axios.get(process.env.SKALE_DEV_IMA_RINKEBY_ABI)
  let communityPool = new ethers.Contract(IMA_ABI.data.community_pool_address, IMA_ABI.data.community_pool_abi, mainEthersProvider)

  // console.log('communityPool', communityPool)
  // process.exit()

  console.log('mainchain user balance:', (await mainEthersProvider.getBalance(mainchainUser.address)).toString())

  let tx
  try {
    tx = await communityPool.connect(mainchainUser).rechargeUserWallet(process.env.SKALE_DEV_CHAIN_NAME, {
      value: ethers.utils.parseUnits('0.001', 'ether'),
      gasLimit: 1100000
    })
    await tx.wait(1)
  } catch (error) {
    console.log('ERROR: ', `https://rinkeby.etherscan.io/tx/${tx.transactionHash}`)
  }

  let bal = await communityPool.getBalance(mainchainUser.address)
  console.log('community pool balance:', bal.toString())
}

if (require.main === module) { // only call main when being ran from command line
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

