const vorpal = require('vorpal')()
const Blockchain = require('./blockchain')
const blockchain = new Blockchain()
const Table = require('cli-table')
const rsa = require('./rsa')

// 格式化控制台输出
function formatLatLog (data) {
  if (!data || data.length === 0) {
    return
  }
  if (!Array.isArray(data)) {
    data = [data]
  }

  const one = data[0]
  const head = Object.keys(one)

  const table = new Table({
    head: head,
    colWidths: new Array(head.length).fill(15)
  })
  const res = data.map(d => {
    return head.map(h => JSON.stringify(d[h], null, 1))
  })
  // table is an Array, so you can `push`, `unshift`, `splice` and friends
  table.push(...res)
  console.log(res)
  console.log(table.toString())
}

vorpal
  .command('mine', '挖矿')
  .action(function (args, callback) {
    const block = blockchain.mine()
    if (block) {
      formatLatLog(block)
    }
    callback()
  })
vorpal
  .command('chain', '查看区块链')
  .action(function (args, callback) {
    formatLatLog(blockchain.blockchain)
    callback()
  })
vorpal
  .command('blance <address>', '查询余额')
  .action(function (args, callback) {
    const blance = blockchain.blance(args.address)
    if (blance) {
      formatLatLog({ blance, address: args.address })
    }
    callback()
  })
vorpal
  .command('detail <index>', '查看区块详情')
  .action(function (args, callback) {
    const block = blockchain.blockchain[args.index]
    console.log(JSON.stringify(block, null, 2))
    callback()
  })

vorpal
  .command('trans <to> <amount>', '转账')
  .action(function (args, callback) {
    // 本地公钥当作转出地址
    const transfer = blockchain.transfer(rsa.rsaKey.pub, args.to, args.amount)
    if (transfer) {
      formatLatLog(transfer)
    }
    callback()
  })

vorpal
  .command('pub', '查看本地地址')
  .action(function (args, callback) {
    // 本地公钥当作转出地址
    console.log(rsa.rsaKey.pub)
    callback()
  })

vorpal
  .command('peers', '查看网络节点列表')
  .action(function (args, callback) {
    formatLatLog(blockchain.peers)
    callback()
  })
vorpal
  .command('chat <msg>', '和其他节点发送消息')
  .action(function (args, callback) {
    blockchain.boardcast({
      type: 'hi',
      data: args.msg
    })
    callback()
  })
vorpal
  .command('pending', '查看还未打包的交易')
  .action(function (args, callback) {
    formatLatLog(blockchain.data)
    callback()
  })

console.log('welcome to chain')
vorpal.exec('help')

vorpal.delimiter('chain =>')
  .show()
