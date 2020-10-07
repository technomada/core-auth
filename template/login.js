module.exports = (req,res)=>{

	let {success_url} = req.query
	success_url = success_url || "./"
	console.log({success_url})
	let _success = success_url.replace(/[`']/gi,'_') //` make sure to use!
	console.log({_success})

return `
<!doctype html>
<html>
	<head>
		<title>Auth</title>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<style>
			html {height: 100%;}
			body {height: 100%; background: rgb(24,24,33); color:#777; font: normal 16px arial;
				display: grid;
				place-content: center;
				text-align: center;
				}

			input {background: #111; padding: 5px; border: none; x: solid 1px #555; border-radius: 3px; color: #777;}
			

			button {border: none; outline: none; background: #333; color: #777; font-weight: bold; padding: 5px 25px 5px 25px; border-radius: 5px; cursor: pointer; margin-left: 25px;}

			a {opacity: 0.88; text-decoration: none;}

			form {border: solid 1px #333; padding: 50px;}
			
			.menu {font-size: 14px;}

		</style>
	</head>
	<body>

		<h2>Authentication</h2>
		<p><form class='input-form'>
		<input name='key' autofocus> <button type='submit'>Connect</button>
		</form>
		<form style='display: none;' class='redirect-form' action='${_success}'></form>
		${_success?`<input name='success_url' value='${_success}' type=hidden></input>`:``}
	<p class='menu'><a href='./register'>register</a> |
	<a href='./forgot'>forgot</a>
	</p>
<script>
	document.querySelector('.input-form').onsubmit = async e=>{
		e.preventDefault()

		console.log('form!')
		let v = document.querySelector('input').value
		console.log('try',v)
		let f = await fetch('./api/v1/reg/'+v)
		//upg: error check
		f = await f.json()
		console.log("RESULT!:",f)
		if(f){
			document.querySelector('.redirect-form').submit()
			}
		console.log('ff',f)
		}
</script>
</body>
</html>
`
}
