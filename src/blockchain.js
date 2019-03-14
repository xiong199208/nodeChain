const crypto = require('crypto')
const initBlock = {
  index: 0,
  data: 'hello chain!',
  prevHash: '0',
  timestamp: 1552462069690,
  nonce: 3483,
  hash: '0007ce7fa2b29410a29590e93587bceeccb2d8120f0e99b0cd6f45fe4bf7c169'
}
class Blockchain{
	constructor(){
		this.blockchain = [
			initBlock
		]
		this.data = []
		this.difficulty = 3
		//const hash = this.compluteHash(0,'0',new Date().getTime(),'hello world',1)
		//console.log(hash)
	}

	getLastBlock() {
		return this.blockchain[this.blockchain.length-1]
	}
	//挖矿
	mine(){
		const newBlock = this.generateNewBlock();
		//区块合法并且区块链合法
		if(this.isValidaBlock(newBlock) && this.isValidChain()) {
			this.blockchain.push(newBlock)
		} else{
			 console.log('error,invalid Block')	
		}
	}
	//生成新区块
	generateNewBlock(){
		//1.生成新区块 一页新的记账加入区块链
		let nonce = 0;
		const index = this.blockchain.length
		const data = this.data
		const prevHash = this.getLastBlock().hash
		let timestamp = new Date().getTime()
		let hash = this.compluteHash(index,prevHash,timestamp,data,nonce)
		while(hash.slice(0,this.difficulty)!=='0'.repeat(this.difficulty)) {
			nonce +=1
			hash = this.compluteHash(index,prevHash,timestamp,data,nonce)
			//console.log(nonce,hash)
		}
		return {
			index,
			data,
			prevHash,
			timestamp,
			nonce,
			hash
		}
		
	}
	
	//计算哈希
	compluteHash(index,prevHash,timestamp,data,nonce) {
		return crypto
		.createHash('sha256')
		.update(index+prevHash+timestamp+data+nonce)
		.digest('hex')	
	}
	//校验区块
	isValidaBlock(newBlock,lastBlock=this.getLastBlock()){
		//1.区块的index等于最新的区块加1
		//2.区块的time大于最新的区块
		//3.最新区块的prevHash等于最新的区块的hash
		//4.区块的hash值符合难度要求
		if(newBlock.index!==lastBlock.index+1) {
			console.log("index",newBlock.index,lastBlock.index+1)
			return false
		} else if(newBlock.timestamp<=lastBlock.timestamp) {
			console.log("timestamp",newBlock.timestamp,lastBlock.timestamp)
			return false
		} else if(newBlock.prevHash!==lastBlock.hash) {
			console.log("hash",newBlock.prevHash,lastBlock.hash)
			return false
		} else if(newBlock.hash.slice(0,this.difficulty)!=='0'.repeat(this.difficulty)) {
			console.log("difficulty")
			return false
		}
		
		return true
	}

	//校验区块链
	isValidChain(chain=this.blockchain) {
		for(let i=chain.length-1;i>=1;i=i-1) {
			if(!this.isValidaBlock(chain[i],chain[i-1])) {
				console.log('普通区块出错')
				return false;
			}
		}

		if(JSON.stringify(chain[0])!==JSON.stringify(initBlock)) {
			console.log('创世区块出错')
			return false;
		}

		return true;
	}
}

let blockchain = new Blockchain();
blockchain.mine()
blockchain.mine()
blockchain.mine()
console.log(blockchain.blockchain)