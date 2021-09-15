const ethers = require('ethers')
const BN = ethers.BigNumber

const DIFFICULTY = BN.from(1)

async function mineGasForTransaction(ethers, tx, signer) {
  if(tx.from === undefined || tx.nonce === undefined) {
    throw new Error('Not enough fields for mining gas (from, nonce)')
  }
  if (!tx.gas) {
    tx.gas = await signer.estimateGas(tx)
  }
  let address = tx.from
  let nonce = tx.nonce
  let gas = tx.gas
  tx.gasPrice = mineFreeGas(gas, address, nonce, ethers)
}

function mineFreeGas(gasAmount, address, nonce, ethers) {
  console.log('Mining free gas: ', gasAmount)
  let nonceHash = BN.from(ethers.utils.solidityKeccak256([ 'uint', ], [ nonce ]), 16)
  let addressHash = BN.from(ethers.utils.solidityKeccak256([ 'address', ], [ address ]), 16)
  let nonceAddressXOR = nonceHash.xor(addressHash)
  let maxNumber = BN.from(2).pow(BN.from(256)).sub(BN.from(1))
  let divConstant = maxNumber.div(DIFFICULTY)
  let candidate
  while (true){
    candidate = ethers.utils.randomBytes(32)
    let candidateHash = BN.from(ethers.utils.solidityKeccak256([ 'bytes32', ], [ candidate ]), 16)
    let resultHash = nonceAddressXOR.xor(candidateHash)
    let externalGas = divConstant.div(resultHash).toNumber()
    console.log('herre', externalGas, gasAmount)
    if (externalGas >= gasAmount) {
      break
    }
  }
  return BN.from(candidate, 16).toString()
}

exports.mineGasForTransaction = mineGasForTransaction
exports.mineFreeGas = mineFreeGas