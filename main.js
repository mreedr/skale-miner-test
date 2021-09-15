require('dotenv').config()

let ethers = require('ethers')
let BN = ethers.BigNumber
let Web3 = require('web3')
// web3 = new Web3(process.env.INFURA_ENDPOINT);
web3 = new Web3(process.env.SKALE_ENDPOINT);
// let ethersProvider = new ethers.providers.JsonRpcProvider(process.env.INFURA_ENDPOINT)
let ethersProvider = new ethers.providers.JsonRpcProvider(process.env.SKALE_ENDPOINT)

let web3Miner = require('./skale-miner-web3')
// let ethersMiner = require('./skale-miner-ethers')

let skaleOwnerPK = process.env.SKALE_PK
let userPK = process.env.RINKEBY_PK

let payerAbi = JSON.parse('[ { "inputs": [], "stateMutability": "payable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "getBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address payable", "name": "receiver", "type": "address" } ], "name": "pay", "outputs": [], "stateMutability": "payable", "type": "function" }, { "stateMutability": "payable", "type": "receive" } ]')
let payerBytecode = "0x608060405261014c806100136000396000f3fe60806040526004361061002d5760003560e01c80630c11dedd1461003657806312065fe01461007a57610034565b3661003457005b005b6100786004803603602081101561004c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506100a5565b005b34801561008657600080fd5b5061008f6100f7565b6040518082815260200191505060405180910390f35b8073ffffffffffffffffffffffffffffffffffffffff166108fc670de0b6b3a76400009081150290604051600060405180830381858888f193505050501580156100f3573d6000803e3d6000fd5b5050565b60003073ffffffffffffffffffffffffffffffffffffffff163190509056fea26469706673582212209d96fa3f8ceebc1f6b77e3efcf549b29df42a18bd96fd90b298e5391f504821e64736f6c63430007040033"

async function main() {
  // let contract = new ethers.Contract('0x3fca0a6295d42f5b87eac3fed4c2364361c46d17', payerAbi, ethersProvider)
  // console.log('payer contract', (await contract.getBalance()).toString())
  let contractAddr = await deployPayer(web3, skaleOwnerPK)
  await doWeb3Mine(contractAddr, userPK)
}

async function doWeb3Mine(contractAddr, pk) {
  let seperateAcct = new ethers.Wallet(pk, ethersProvider)
  let tx =  {
    from: seperateAcct.address,
    to: contractAddr,
    data: "0x0c11dedd000000000000000000000000"+seperateAcct.address.slice(2),
    nonce: await web3.eth.getTransactionCount(seperateAcct.address)
  }
  await web3Miner.mineGasForTransaction(web3, tx)
  console.log('web3: ', tx)
  let signed = await web3.eth.accounts.signTransaction(tx, pk)
  await web3.eth.sendSignedTransaction(signed.rawTransaction)

  console.log(await ethersProvider.getBalance(seperateAcct.address))
}

async function deployPayer(web3, ownerKey) {
    const myContract = new web3.eth.Contract(payerAbi);

    let address = web3.eth.accounts.privateKeyToAccount(ownerKey)['address'];
    let tx = await send(web3, myContract.deploy({data: payerBytecode}), ownerKey, address, 10 ** 19);
    return tx.contractAddress
}

async function send(web3, tr, pk, address, value=0) {
    let gas = await tr.estimateGas({"from": address});
    let nonce = await web3.eth.getTransactionCount(address)
    let tx = {
        "to"  : tr._parent._address,
        "data": tr.encodeABI(),
        "gas" : gas,
        "nonce": nonce,
        "value": value
    };
    let signed = await web3.eth.accounts.signTransaction(tx, pk)
    return web3.eth.sendSignedTransaction(signed.rawTransaction)
}

if (require.main === module) { // only call main when being ran from command line
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}


// async function doEthersMine(pk) {
//   let seperateAcct = new ethers.Wallet(pk, ethersProvider)

//   const tx = await seperateAcct.populateTransaction({
//     to: ethers.constants.AddressZero,
//     value: ethers.utils.parseEther("0.0")
//   })

//   await ethersMiner.mineGasForTransaction(ethers, tx, seperateAcct)
//   console.log('ethers: ', tx)
// }

//https://docs.skale.network/ima/1.0.x/funding-exits

// let anser
// anser = await web3Miner.mineFreeGas('50000000', ethers.constants.AddressZero, 0, web3)
// console.log('web3: ', anser)
// anser = await ethersMiner.mineFreeGas('50000000', ethers.constants.AddressZero, 0, ethers)
// console.log('ethers: ', anser)
// await doEthersMine('0xe4b82aee7d7ea83443634d7786f2faf071e3dc0b05bdfd041e2b8ac96df9268b')
