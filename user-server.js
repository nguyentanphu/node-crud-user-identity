const restify = require('restify')
const util = require('util')

const usersModel = require('./users-sequelize')

const server = restify.createServer({
	name: 'USER-Auth-Service',
	version: '0.0.1'
})

server.use(restify.plugins.authorizationParser())
server.use(check)
server.use(restify.plugins.queryParser())
server.use(restify.plugins.bodyParser({
	mapParams: true
}))

// Create a user record
server.post('/create-user', async (req, res, next) => {
	try {
		var result = await usersModel.create(
			req.params.username, req.params.password,
			req.params.provider,
			req.params.familyName, req.params.givenName,
			req.params.middleName,
			req.params.emails, req.params.photos)
		res.send(result)
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// Update an existing user record
server.post('/update-user/:username', async (req, res, next) => {
	try {
		var result = await usersModel.update(
			req.params.username, req.params.password,
			req.params.provider,
			req.params.familyName, req.params.givenName, req.params.middleName,
			req.params.emails,
			req.params.photos)
		res.send(usersModel.sanitizedUser(result))
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// Find a user, if not found create one given profile information
server.post('/find-or-create', async (req, res, next) => {
	console.log('find-or-create ' + util.inspect(req.params))
	try {
		var result = await usersModel.findOrCreate({
			id: req.params.username,
			username: req.params.username, password: req.params.password,
			provider: req.params.provider,
			familyName: req.params.familyName, givenName: req.params.givenName, middleName: req.params.middleName,
			emails: req.params.emails,
			photos: req.params.photos
		})
		res.send(result)
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// Find the user data (does not return password)
server.get('/find/:username', async (req, res, next) => {
	try {
		var user = await usersModel.find(req.params.username)
		if (!user) {
			res.send(404, new Error('Did not find ' + req.params.username))
		} else {
			res.send(user)
		}
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// Delete/destroy a user record
server.del('/destroy/:username', async (req, res, next) => {
	try {
		await usersModel.destroy(req.params.username)
		res.send({})
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// Check password
server.post('/passwordCheck', async (req, res, next) => {
	try {
		await usersModel.userPasswordCheck(req.params.username, req.params.password)
		res.send(check)
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

// List users
server.get('/list', async (req, res, next) => {
	try {
		let userlist = await usersModel.listUsers()
		if (!userlist) userlist = []
		res.send({userlist})
		next(false)
	} catch (err) {
		res.send(500, err)
		next(false)
	}
})

server.listen(process.env.PORT, 'localhost', () => {
	console.log(server.name + ' listening at ' + server.url);
})

const apiKeys = [{
	user: 'them',
	key: 'D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF'
}];

function check(req, res, next) {

	if (req.authorization) {
		var found = false;
		for (let auth of apiKeys) {
			if (auth.key === req.authorization.basic.password
				&& auth.user === req.authorization.basic.username) {
				found = true;
				break;
			}
		}
		if (found) next();
		else {
			res.send(401, new Error("Not authenticated"));
			next(false);
		}
	} else {
		res.send(500, new Error('No Authorization Key'));
		next(false);
	}
}

