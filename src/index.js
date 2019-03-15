const vorpal = require('vorpal')()
const Blockchain = require('./blockchain')
const blockchain = new Blockchain()
const Table = require('cli-table')
//格式化控制台输出
function formatLatLog(data) {
    if(!Array.isArray(data)) {
        data = [data]
    }

    const one = data[0]
    const head = Object.keys(one)

    
    const table = new Table({
        head: head
      , colWidths: new Array(head.length).fill(15)
    });
    const res = data.map(d=>{
        return head.map(h=>d[h])
    })
    // table is an Array, so you can `push`, `unshift`, `splice` and friends
    table.push(...res);
    console.log(res)
    console.log(table.toString());
}

vorpal
    .command('mine','挖矿')
    .action(function(args,callback) {
        const block = blockchain.mine()
        if(block) {
            formatLatLog(block)
        }
        callback()
    })
vorpal
    .command('chain','查看区块链')
    .action(function(args,callback) {
        formatLatLog(blockchain.blockchain)
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