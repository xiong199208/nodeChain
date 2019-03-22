 let fs = require('fs')
let EC = require('elliptic').ec
let ec = new EC('secp256k1')
let keypair = ec.genKeyPair()

const keys = genKeys()

function getPub (prv) {
  return ec.keyFromPrivate(prv).getPublic('hex').toString()
}
function genKeys () {
  const fileName = `${__dirname}/woniu-wallet.json`
  try {
    let res = JSON.parse(fs.readFileSync(fileName))
    if (res.prv && res.pub && getPub(res.prv) === res.pub) {
      keypair = ec.keyFromPrivate(res.prv)
      return res
    } else {
      throw new Error('not valid json')
    }
  } catch (error) {
    // 出错了 写逻辑
    let res = {
      prv: keypair.getPrivate('hex').toString(),
      pub: keypair.getPublic('hex').toString()
    }
    fs.writeFileSync(fileName, JSON.stringify(res))
    return res
  }
}

function signMsg (value, prv = keys.prv) {
  const keypairTemp = ec.keyFromPrivate(prv)
  const buffferMsg = Buffer.from(value)
  let hexSignature = Buffer.from(keypairTemp.sign(buffferMsg).toDER()).toString('hex')

  return hexSignature
}
function verifyMsg (value, sig, pub) {
  const keypairTemp = ec.keyFromPublic(pub, 'hex')
  let binaryMessage = Buffer.from(value)

  return keypairTemp.verify(binaryMessage, sig)
}

function sign ({ from, to, amount, timestamp }) {
  return signMsg(`${timestamp}-${amount}-${from}-${to}`)

  // const buffferMsg = Buffer.from(`${from}-${to}-${amount}`)
  // let hexSignature = Buffer.from(keypair.sign(buffferMsg).toDER()).toString('hex')
  // return hexSignature
}
function verify ({ from, to, amount, timestamp, sig }) {
  return verifyMsg(`${timestamp}-${amount}-${from}-${to}`, sig, from)
  // const keypairTemp = ec.keyFromPublic(pub, 'hex')

  // let binaryMessage = Buffer.from(`${from}-${to}-${amount}`)

  // return keypairTemp.verify(binaryMessage, sig)
}
module.exports = { keys, sign, verify, signMsg, verifyMsg, getPub }
const trans = {from:"048d0cff7bbf76bd485e493ed18855aad9823513caba01a68e6ee21fec7669b6e891ec38c6bd02697b38c4a54be39d9c982993de10bce771ddca379f4a70152e09",to:"test1",amount:15,timestamp:"test"}
//const trans1 = {from:"test3",to:"test2",imooc:100}
const signature = sign(trans)
trans.sig = signature
console.log(signature)
console.log(verify(trans))
