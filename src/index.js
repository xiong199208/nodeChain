const vorpal = require('vorpal')()
const Blockchain = require('./blockchain')
const blockchain = new Blockchain()

vorpal
    .command('mine','挖矿')
    .action(function(args,callback) {
        const block = blockchain.mine()
        if(block) {
            console.log(block);
        }
        callback()
    })
vorpal
    .command('chain','查看区块链')
    .action(function(args,callback) {
        console.log(blockchain.blockchain);
        callback()
    })


// vorpal
//     .command('hello','你好')
//     .action(function(args,callback) {
//         this.log('你好，vorpal')
//         callback
//     })

console.log('welcome to chain')
vorpal.exec('help')   

vorpal.delimiter("chain =>")
    .show()    