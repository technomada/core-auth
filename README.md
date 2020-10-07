# Core Auth
Simple central system.
- auth
- env


# How to use:
```
$ sudo docker run -d --restart=always --name=auth -p 3000:3000 -v /path/to/config.js:/app/config.js technomada/core-auth 
```

Visit
```
https://localhost:3000
```
