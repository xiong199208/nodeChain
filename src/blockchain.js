const crypto = require('crypto')
const dgram = require('dgram')
const rsa = require('./rsa')
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
		//所有网络节点
		this.peers = []
		this.remote = {} 
		//种子节点
		this.seed = {port:8001,address:'localhost'}
		this.udp = dgram.createSocket('udp4')
		this.init()
		//const hash = this.compluteHash(0,'0',new Date().getTime(),'hello world',1)
		//console.log(hash)
	}

	init() {
		this.bindP2p()
		this.bindExit()
	}

	bindP2p() {
		this.udp.on('message',(data,remote)=>{
			const {address,port} = remote
			const action = JSON.parse(data)
			if(action.type) {
				this.dispatch(action,{address,port})
			}
		})
		this.udp.on('listening',()=>{
			const address = this.udp.address()
			console.log('udp信息：udp监听完毕：'+JSON.stringify(address))
		})
		//区分种子节点和普通节点
		const port = Number(process.argv[2]) || 0
		this.startNode(port)
	}
	//启动节点
	startNode(port) {
		this.udp.bind(port)
		if(port!==8001) {
			this.send({
				type:'newpeer'
			},this.seed.port,this.seed.address)
			//把种子节点加入到列表中
			this.peers.push(this.seed)
		}
	}

	send(message,port,address) {
		//console.log('send',message,port,address)
		this.udp.send(JSON.stringify(message),port,address)
	}
	//广播所有节点
	boardcast(action) {
		this.peers.forEach(v=>{
			this.send(action,v.port,v.address)
		})
	}

	//分发消息
	dispatch(action,remote) {
		switch(action.type) {
			case 'newpeer':
				//1.公网ip和port
				this.send({
					type:'remoteAddress',
					data:remote
				},remote.port,remote.address)
				//2.全部节点列表
				this.send({
					type:'peerList',
					data:this.peers
				},remote.port,remote.address)
				//3/告诉所有所有已知节点，来了新人
				this.boardcast({
					type:'hello',
					data:remote
				})
				//4告诉现有区块链的数据
				this.send({
					type:'blockchain',
					data:JSON.stringify({
						blockchain:this.blockchain,
						//trans:this.data
					})
				},remote.port,remote.address)

				this.peers.push(remote)
				console.log('新节点接入',remote)
			break
			case 'blockchain':
				//同步本地链
				let allData = JSON.parse(action.data)
				let newChain = allData.blockchain
				this.replaceChain(newChain)
			break
			case 'remoteAddress':
				//储存远程消息
				this.remote = action.data
			break
			case 'peerList':
				 //当前节点列表
				 const newpeers = action.data
				 this.addPeers(newpeers)
			break
			case 'hello':
				 let remotedata = action.data
				 this.peers.push(remotedata)
				 console.log('新朋友来了')
				 this.send({type:'hi',data:remote},remotedata.port,remotedata.address)
			break
			case 'hi':
				console.log(`${remote.address}:${remote.port}:${JSON.stringify(action.data)}`)
			break
			default:
			console.log('无法识别的消息类型')
		}
	}

	isEqualPeer(peer1,peer2) {
		return peer1.address===peer2.address && peer1.port===peer2.port
	}

	addPeers(peers) {
		peers.forEach(peer=>{
			if(!this.peers.find(v=>this.isEqualPeer(peer,v))) {
				this.peers.push(peer)
			}
		})
	}

	bindExit() {
		process.on('exit',()=>{
			console.log("udp信息：udp退出")
		})
	}

	//获取最新得区块
	getLastBlock() {
		return this.blockchain[this.blockchain.length-1]
	}

	//转账
	transfer(from,to,amount) {
		if(from!=='0') {
			const blance = this.blance(from);
			if(blance<amount) {
				console.log('noet enough blance',from,blance,amount);
				return null;
			}
			
		}
		//签名校验
		//const tansobj = {from,to,amount}
		const signature = rsa.sign({from,to,amount})
		const signTrans = {from,to,amount,signature}
		this.data.push(signTrans)
		return signTrans
	}

	//查看余额
	blance(address) {
		let blance = 0;
		this.blockchain.forEach(block=>{
			if(!Array.isArray(block.data)) {
				return
			}
			block.data.forEach(trans=>{
				if(address==trans.from) {
					blance -=trans.amount
				}

				if(address==trans.to) {
					blance +=trans.amount
				}
			})
		})
		return blance
	}

	isValidTransfer(trans) {
		//是不是合法的转账
		//地址即是公钥
		return rsa.verify(trans,rsa.rsaKey.pub)
	}

	//挖矿
	mine(){
		//检测交易合法性
		// if(!this.data.every(v=>this.isValidTransfer(v))) {
		// 	console.log('trans not valid')
		// 	return
		// }
		this.data = this.data.filter(v=>this.isValidTransfer(v))


		this.transfer('0',rsa.rsaKey.pub,100)
		const newBlock = this.generateNewBlock();
		//区块合法并且区块链合法
		if(this.isValidTransfer && this.isValidaBlock(newBlock) && this.isValidChain()) {
			let block = this.blockchain.push(newBlock)
			this.data = []
			return newBlock
		} else{
			 console.log('error,invalid Block')	
		}
		return
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
	//校验区块hash
	checkCompluteHash({index,prevHash,timestamp,data,nonce}) {
		return this.compluteHash(index,prevHash,timestamp,data,nonce);
	}
	//校验区块
	isValidaBlock(newBlock,lastBlock=this.getLastBlock()){
		//1.区块的index等于最新的区块加1
		//2.区块的time大于最新的区块
		//3.最新区块的prevHash等于最新的区块的hash
		//4.区块的hash值符合难度要求
		//5.新区块的哈希值计算正确 
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
		} else if(newBlock.hash!==this.checkCompluteHash(newBlock)) {
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
	replaceChain(newChain) {
		if(newChain.length===1) {
			return
		}
		if(this.isValidChain(newChain) && newChain.length>this.blockchain.length) {
			//拷贝
			this.blockchain = JSON.parse(JSON.stringify(newChain))
		} else{
			console.log("错误：不合法链")
		}
	}
}

module.exports = Blockchain