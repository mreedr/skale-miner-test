require('dotenv').config()

let ethers = require('ethers')
let BN = ethers.BigNumber
let Web3 = require('web3')

// web3 = new Web3(process.env.INFURA_ENDPOINT);
web3 = new Web3(process.env.SKALE_ENDPOINT);
// let ethersProvider = new ethers.providers.JsonRpcProvider(process.env.INFURA_ENDPOINT)
let ethersProvider = new ethers.providers.JsonRpcProvider(process.env.SKALE_ENDPOINT)

let web3Miner = require('./skale-miner-web3')
let ethersMiner = require('./skale-miner-ethers');
const { assert } = require('console');

let skaleOwner = new ethers.Wallet(process.env.SKALE_PK, ethersProvider)
let userPK = process.env.RINKEBY_PK

let payerAbi = JSON.parse('[ { "inputs": [], "stateMutability": "payable", "type": "constructor" }, { "stateMutability": "payable", "type": "fallback" }, { "inputs": [], "name": "getBalance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address payable", "name": "receiver", "type": "address" } ], "name": "pay", "outputs": [], "stateMutability": "payable", "type": "function" }, { "stateMutability": "payable", "type": "receive" } ]')
let payerBytecode = "0x608060405261014c806100136000396000f3fe60806040526004361061002d5760003560e01c80630c11dedd1461003657806312065fe01461007a57610034565b3661003457005b005b6100786004803603602081101561004c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506100a5565b005b34801561008657600080fd5b5061008f6100f7565b6040518082815260200191505060405180910390f35b8073ffffffffffffffffffffffffffffffffffffffff166108fc670de0b6b3a76400009081150290604051600060405180830381858888f193505050501580156100f3573d6000803e3d6000fd5b5050565b60003073ffffffffffffffffffffffffffffffffffffffff163190509056fea26469706673582212209d96fa3f8ceebc1f6b77e3efcf549b29df42a18bd96fd90b298e5391f504821e64736f6c63430007040033"

/* - - - MAIN - - -  */
async function main() {
  let payerContr = await deployPayer(web3, process.env.SKALE_PK)
  let pBal = await payerContr.getBalance()
  console.log('payer bal', pBal.toString())
  assert(pBal.toString() !== '0')
  await doWeb3Mine(payerContr.address, userPK)
  pBal = await payerContr.getBalance()
  console.log('payer bal', pBal.toString())
}

// async function mainSkale() {
//   let payerContr = await deployPayer(web3, process.env.SKALE_PK)
//   let pBal = await payerContr.getBalance()
//   console.log('payer bal', pBal.toString())
//   assert(pBal.toString() !== '0')
//   await doWeb3Mine(payerContr.address, userPK)
// }

async function doWeb3Mine(contractAddr, pk) {
  let seperateAcct = new ethers.Wallet(pk, ethersProvider)
  let tx =  {
    from: seperateAcct.address,
    to: contractAddr,
    data: "0x0c11dedd000000000000000000000000"+seperateAcct.address.slice(2),
    nonce: await web3.eth.getTransactionCount(seperateAcct.address)
  }
  await web3Miner.mineGasForTransaction(web3, tx)

  let signed = await web3.eth.accounts.signTransaction(tx, pk)
  await web3.eth.sendSignedTransaction(signed.rawTransaction)

  console.log((await ethersProvider.getBalance(seperateAcct.address)).toString())
}

async function deployPayer(web3, ownerKey) {
    const myContract = new web3.eth.Contract(payerAbi);
    let address = web3.eth.accounts.privateKeyToAccount(ownerKey)['address'];
    // let tx = await send(web3, myContract.deploy({data: payerBytecode}), ownerKey, address, ethers.utils.parseUnits('1', 'ether').toString());
    let tx = await send(web3, myContract.deploy({data: payerBytecode}), ownerKey, address, 10 ** 18);
    return new ethers.Contract(tx.contractAddress, payerAbi, ethersProvider)
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


async function doEthersMine(contractAdd, pk) {
  let seperateAcct = new ethers.Wallet(pk, ethersProvider)

  console.log('before:', (await ethersProvider.getBalance(seperateAcct.address)).toString())
  const tx = await seperateAcct.populateTransaction({
    to: contractAdd,
    value: ethers.utils.parseEther("0.0"),
    data: "0x0c11dedd000000000000000000000000"+seperateAcct.address.slice(2)
  })
  await ethersMiner.mineGasForTransaction(ethers, tx, seperateAcct)
  console.log('tx', tx.gas.toString())

  delete tx.gas
  await seperateAcct.sendTransaction(tx)
  // await web3.eth.sendSignedTransaction(signed.rawTransaction)

  console.log('after:', (await ethersProvider.getBalance(seperateAcct.address)).toString())
}

//https://docs.skale.network/ima/1.0.x/funding-exits

// let anser
// anser = await web3Miner.mineFreeGas('50000000', ethers.constants.AddressZero, 0, web3)
// console.log('web3: ', anser)
// anser = await ethersMiner.mineFreeGas('50000000', ethers.constants.AddressZero, 0, ethers)
// console.log('ethers: ', anser)
// await doEthersMine('0xe4b82aee7d7ea83443634d7786f2faf071e3dc0b05bdfd041e2b8ac96df9268b')

/*
async function doWeb3Mine(contractAddr, pk, hash) {
  let seperateAcct = new ethers.Wallet(pk, ethersProvider)
  let tx =  {
    from: seperateAcct.address,
    to: contractAddr,
    data: "0x0c11dedd000000000000000000000000"+seperateAcct.address.slice(2),
    nonce: await web3.eth.getTransactionCount(seperateAcct.address)
  }
  await web3Miner.mineGasForTransaction(web3, tx)
  console.log('web3: ', tx)
  // if (hash) {
  //   tx.gasPrice = hash
  //   console.log('web3: ', tx)
  // }

  let signed = await web3.eth.accounts.signTransaction(tx, pk)
  await web3.eth.sendSignedTransaction(signed.rawTransaction)

  console.log((await ethersProvider.getBalance(seperateAcct.address)).toString())
}


  // let hash = ethersMiner.mineFreeGas(31377, seperateAcct.address, (await web3.eth.getTransactionCount(seperateAcct.address)).toString(), ethers)
  // let hash = ethersMiner.mineFreeGas(BN.from('31377'), seperateAcct.address, (await web3.eth.getTransactionCount(seperateAcct.address)).toString(), ethers)
  // console.log('hash', hash)
  // await doWeb3Mine(payerContr.address, userPK, hash)

  // await doEthersMine(payerContr.address, userPK)

  // // let x = web3Miner.mineFreeGas('50000', seperateAcct.address, 1, web3)
  // // console.log('x', x.toString())

  // // console.log('y', y.toString())
  // console.log('hash', hash)
  // await doWeb3Mine(payerContr.address, userPK, hash)


  // let payerContr = new ethers.Contract(process.env.PAYER_ADDR, payerAbi, ethersProvider)
  // console.log('payer contract', (await payerContr.getBalance()).toString())


  // let contractAddr = await deployPayer(web3, skaleOwnerPK)

    // let seperateAcct = new ethers.Wallet(userPK, ethersProvider)
  // let payerContr = new ethers.Contract(process.env.PAYER_ADDR, payerAbi, ethersProvider)
  // console.log(payerContr)
  // let pBal = await payerContr.connect(skaleOwner).pay(ethers.utils.parseUnits('0.001', 'ether'))
  // console.log('bal', pBal.toString())

*/