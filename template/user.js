module.exports = (app)=>{

	let {user} = app
	let {nick} = user

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

			input {background: black; padding: 5px; border: none; x: solid 1px #555; border-radius: 3px; color: #777;}
			

			button {border: none; outline: none; background: #333; color: #777; font-weight: bold; padding: 5px 25px 5px 25px; border-radius: 5px; cursor: pointer; margin-left: 25px;}

			a {opacity: 0.88;}

			form {border: solid 1px #333; padding: 50px;}
			

		</style>
	</head>
	<body>

		<h2>Authenticated</h2>
		<p>Hello ${nick}
		<a href='./logout'>Logout</a>
	</body>
</html>
`
}

