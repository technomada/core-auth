const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')
const cors = require('cors')
const fetch = require('node-fetch')
const { v4: uuidv4 } = require('uuid');


const crypto = require('crypto');

// -----------------------
// config
// 

let config = {
	users:[]
	}

try{
	config = require('./config.js')
	}
catch(e){
	console.log(e)
	console.log('no config.js detected.')
	}

let {PORT,SECURE} = process.env

PORT = PORT || config.port || 3000

try{
	SECURE = JSON.parse(SECURE)
	}
catch(e){
	console.log('note: can use SECURE=false node server.js')
	}

if(typeof(SECURE)=='undefined')
	SECURE = config.secure
if(typeof(SECURE) == 'undefined') {
	console.log('setting to SECURE')
	SECURE = true
	}


// ----------------------
//
//
;(async n=>{
	let app = express()

	app.use(cors({credentials:true,origin:true}))
	app.use(cookieParser())
	app.use(express.json({strict:false}))


	let hashindex = {} // hash to appid
	let appidindex = {} // appid info (appid record)
	let tasks = []

	// -------------------------
	const cook = (req,res)=>{
		// 
		// Make sure has appid cookie.
		// Updates cookie timeout.
		// Returns appid.
		//
		// upg: auto run this on all requests?
		let {appid} = req.cookies

		console.log('cook',{appid})


		const buildLink = appid=>{
			const hash = crypto.createHash('sha256');
			hash.update(appid) // upg: make strong random pair.
			let h = hash.digest('hex')
			hashindex[h] = appid
			appidindex[appid] = {
				appid,
				hash:h,
				user:false, // set to current logged in user record. (or false)
				hooks:{},
				udate: Date.now()/1000
				}

			console.log({hashindex,appidindex})
			}

		if(!appid){
			appid = Math.random()+'' // upg: strong randstr (browser)
			buildLink(appid)
			}
		else {
			//ONLY IN DEBUG MODE.... [as we don't want to take suggestions for cookie id
			if(!appidindex[appid]){
				buildLink(appid)
				}//if
			}//else

		let c = { 
			maxAge: 30 * 24*60*60*1000, // 1 month
			httpOnly: true,
			secure: SECURE
			}

		console.log('cc',c)

		res.cookie('appid', appid, c)

		return appid
		}

	// ----------------------
	let _flushTasks = false
	const flushTasks = async n=>{
		let next = n=>{
			//should use next() instead of flushTasks() when within flushTasks()
			_flushTasks = false
			setTimeout(flushTasks,0)
			}

		if(!_flushTasks && tasks.length > 0){
			_flushTasks = true
			let t = tasks.shift()
			console.log('run task',t)
			let {type} = t

			if(type == 'update'){
				let {cb,app} = t
				let {user} = app
				try{
				console.log('trying update...',{cb,user})
				let uid = uuidv4()
				let ref = app.hash
				user = JSON.parse(JSON.stringify(user))
				delete user.key //upg: user = cleanUser(user)
				let e = {
					type:'user-update',
					uid,
					ref,
					user,
					udate:Date.now()/1000
					}
				let body = JSON.stringify(e)
				let f = await fetch(cb,{
					method: 'POST',
					headers: {
      						'Content-Type': 'application/json'
    						},
					body
						})
				//upg: post json with user record as set-user (with udate as when) .. optionally add as now event?
				f = await f.json()
				console.log({f}) // expect "sub-ok" 
				} catch(e){
					console.log(e)
					}

				//upg: track fails (to remove ok?)
				//.. or do first sub.
				next()
				}
			else
			if(type == 'build-update'){
				let {app} = t
				let {hooks} = app
				for(let i in hooks){
					let v = hooks[i]
					let tt = {
						type: 'update',
						app,
						cb:v.cb
						}

					console.log('tt',tt)
					tasks.push(tt)
					}
				next()
				}
			else {
				next()
				}
			}
		}//func

	// ----------------------
	app.all('/api/v1/ref',(req,res)=>{
		// fetches referance (upg: make random match pair?)
		// upg: this the only cors access? (how to enable cors in express in only certain routes.) 
		let appid = cook(req,res)
		let r = appidindex[appid]
		res.json((r?r.hash:false) || !!r)
		})


	// ----------------------
	app.all('/api/v1/reg/:key',(req,res)=>{
		// login.
		let appid = cook(req,res)
		let {key} = req.params

		let u = config.users.find(v=>{
			return v.key == key
			}) 

		let result = false

		if(u){
			let app = appidindex[appid]
			if(app){
				result = u
				app.user = u
				console.log('set db',u,app)
				tasks.push({
					type:'build-update',
					app
					})
				flushTasks()
				}//if
			else {
				console.log("WARN! -- unexpected for no matching appid")
				}
			}//if

		res.json(result)
		})


	// ------------------------
	app.all('/api/v1/vars/:ref',async (req,res)=>{
		// API: fetch all global vars (geo for now)
		// upg: method to subscribe to changes with these (push events)
		let {ref} = req.params
		
		let result = {}//{auth:config.auth}

		let a = hashindex[ref]
		if(a){
			a = appidindex[a]
			if(a){
				let {user} = a
				if(user){
					let {vars} = user
					result = vars
					}
				}//if

			}//if

		res.json(result)
		})

	// ------------------------
	app.all('/api/v1/me/:ref',async (req,res)=>{
		
		let {ref} = req.params
		
		let result = false

		let a = hashindex[ref]
		if(a){
			a = appidindex[a]
			if(a){
				let {user} = a
				if(user){
					let {uid,nick} = user
					result = {uid,nick}
					}
				}//if

			}//if

		res.json(result)
		})
	// -------------------------
	app.all('/api/v1/sub/:ref',async (req,res)=>{
		// subscribe to events
		let {ref} = req.params
		let {cb} = req.query
		//let appid = cook(req,res)
		let result = false
		
		console.log({ref,cb})
		let a = hashindex[ref]
		if(a){
			a = appidindex[a]
			if(a){
				a.hooks[cb] = {cb,udate:Date.now()/1000}
				console.log('updated',a)

				//upg:
				// await verifySub(cb) .. only continue if verified.
				//  -- returns sub-ok

				tasks.push({
					type:'update',
					app:a,
					cb
					})

				setTimeout(flushTasks,0) // queue to try flush
				result = true
				}//if
			}

		res.json(result)
		})


	app.all('/logout',(req,res)=>{
		let appid = cook(req,res)
		
		//keep appid? or?
		//res.cookie('appid', {maxAge: 0});
		let app = appidindex[appid]
		if(app){
			console.log('before',JSON.parse(JSON.stringify(app)))
			app.user = false
			console.log('after',app)
			tasks.push({
				type:'build-update',
				app
				})
			flushTasks()
			}//if

		res.send('ok.')
		
		})


	// ----------------------
	app.all('/',(req,res)=>{
		let li = require('./template/login.js')
		let us = require('./template/user.js')

		let appid = cook(req,res)

		console.log("Home Cook",appid)

		let app = appidindex[appid]
		if(!app || (app && !app.user)) 
			res.send(li(req,res))
		else
			res.send(us(app))
		
		})


	// -------------------------------------------------
	app.all('/debug/sample/success_redirect',async (req,res)=>{
		// if want to return control after forwarding to login
		let {query} = req

		console.log('SUCCESS REDIRECT..',query)


		res.send('ok.')
		})	

	// -----------------------
	// app.use(express.static(path.join(__dirname,'www')))
	
	// -----------------------
	app.listen(PORT,async n=>{
		console.log('port ready',PORT)
		})
	})();

/*

$ curl -c cook.txt -b cook.txt -v http://localhost:3111/api/v1/reg/bob.12345

 */
