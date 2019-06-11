const restify = require('restify-clients')
const util = require('util')

const client = restify.createJsonClient({
	url: `http://localhost:${process.env.PORT}`,
	version: '*'
})

// @ts-ignore
client.basicAuth('them', 'D4ED43C0-8BD6-4FE2-B358-7C0E230D11EF')

// @ts-ignore
client.post('/create-user', {
	username: "me", password: "w0rd", provider: "local",
	familyName: "Einarrsdottir", givenName: "Ashildr", middleName: "",
	emails: [], photos: []
	},
	(err, req, res, obj) => {
		if (err) console.error(err.stack);
		else console.log('Created ' + util.inspect(obj));
	});
