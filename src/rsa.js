var EC = require('elliptic').ec;
var fs = require("fs")
// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

// Generate keys
var key = ec.genKeyPair();
//生成公私钥对
// const res = {
//     prv:key.getPrivate('hex').toString(),
//     pub:key.getPublic('hex').toString()
// }

function getPub(prv) {
    return  ec.keyFromPrivate(prv).getPublic('hex').toString();
}

//公私钥对持久化
const rsaKey = generateKeys()
function generateKeys() {
    const fileName = './wallet.json'
    try{
        let res = JSON.parse(fs.readFileSync(fileName))
        if(res.prv && res.pub && getPub(res.prv)===res.pub) {
             key = ec.keyFromPrivate(res.prv)
             return res  
        } else{ //验证失败重新生成
             throw 'not valid wallet'
        }
    } catch(err) {
        //文件不存在重新生成
        const res = {
            prv:key.getPrivate('hex').toString(),
            pub:key.getPublic('hex').toString()
        }
        fs.writeFileSync(fileName,JSON.stringify(res))
        return res
    }
}
//console.log(rsaKey())
//签名
function sign({from,to,amout}) {
    const bufferMsg = Buffer.from(`${from}-${to}-${amout}`)
    let signature =  Buffer.from(key.sign(bufferMsg).toDER()).toString('hex')
    return signature
}
//校验签名
function verify({from,to,amount,signature},pub) {
    //生成临时公钥对
    const keypairTemp = ec.keyFromPublic(pub,'hex')
    const bufferMsg = Buffer.from(`${from}-${to}-${amount}`)
    return keypairTemp.verify(bufferMsg,signature)
}
const trans = {from:"test1",to:"test2",imooc:100}
//const trans1 = {from:"test3",to:"test2",imooc:100}
const signature = sign(trans)
trans.signature = signature
console.log(signature)
console.log(verify(trans,rsaKey.pub))