var EC = require('elliptic').ec;
var fs = require("fs")
// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

// Generate keys
var keypair = ec.genKeyPair();
//生成公私钥对
// const res = {
//     prv:keypair.getPrivate('hex').toString(),
//     pub:keypair.getPublic('hex').toString()
// }
//公私钥对持久化
const rsaKey = generateKeys()

function getPub(prv) {
    return  ec.keyFromPrivate(prv).getPublic('hex').toString();
}
function generateKeys() {
    const fileName = './wallet.json'
    try{
        let res = JSON.parse(fs.readFileSync(fileName))
        if(res.prv && res.pub && getPub(res.prv)===res.pub) {
            keypair = ec.keyFromPrivate(res.prv)
             return res  
        } else{ //验证失败重新生成
             throw 'not valid wallet'
        }
    } catch(err) {
        //文件不存在重新生成
        const res = {
            prv:keypair.getPrivate('hex').toString(),
            pub:keypair.getPublic('hex').toString()
        }
        fs.writeFileSync(fileName,JSON.stringify(res))
        return res
    }
}
//console.log(rsaKey())
//签名
function sign({from,to,amount},prv=rsaKey.prv) {
    const keypairTemp = ec.keyFromPrivate(prv)
    const buffferMsg = Buffer.from(`${from}-${to}-${amount}`)
    let hexSignature = Buffer.from(keypairTemp.sign(buffferMsg).toDER()).toString('hex')
  return hexSignature
}
//校验签名
function verify({from,to,amount,signature},pub) {
    //生成临时公钥对
    const keypairTemp = ec.keyFromPublic(pub,'hex')
    const bufferMsg = Buffer.from(`${from}-${to}-${amount}`)
    
    return keypairTemp.verify(bufferMsg,signature)
}

module.exports = {sign,verify,rsaKey}

const trans = {from:"048d0cff7bbf76bd485e493ed18855aad9823513caba01a68e6ee21fec76699",to:"test1",amount:15}
//const trans1 = {from:"test3",to:"test2",imooc:100}
const signature = sign(trans)
trans.signature = signature
console.log(signature)
console.log(verify(trans,rsaKey.pub))