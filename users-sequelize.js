const Sequelize = require('sequelize')
const fs = require('fs-extra')

let SqlUser;
let sequlz;
async function connectDb() {
	if (!sequlz) {
		// const yamlConfig = await fs.readFile(path.join(__dirname, 'models/se'), 'utf-8')

		// const params = jsyaml.safeLoad(yamlConfig)
		// @ts-ignore
		sequlz = new Sequelize('NoteUsers', 'sa', '123456', {
			dialect: 'mssql',
			host: 'localhost',
			port: 1434
		})
	}

	if (SqlUser) return SqlUser.sync()

	if (!SqlUser) SqlUser = sequlz.define('User', {
		username: { type: Sequelize.STRING, unique: true },
		password: Sequelize.STRING,
		provider: Sequelize.STRING,
		familyName: Sequelize.STRING,
		givenName: Sequelize.STRING,
		middleName: Sequelize.STRING,
		emails: Sequelize.STRING(2048),
		photos: Sequelize.STRING(2048)
	});

	return SqlUser.sync()
}

exports.create = async (username, password, provider, familyName, givenName, middleName, emails, photos) => {
	const SQUser = await connectDb();
	return SQUser.create({
		username, password, provider,
		familyName, givenName, middleName,
		emails: JSON.stringify(emails), photos: JSON.stringify(photos)
	});
}

exports.find = async (username) => {
	const SqlUser = await connectDb()
	const user = await SqlUser.findOne({
		where: {
			username: username
		}
	})

	if (user)
		return exports.sanitizedUser(user)

	return undefined
}

exports.update = async (username, password, provider, familyName, givenName, middleName, emails, photos) => {
	const SqlUser = await connectDb()
	const dbUser = await SqlUser.findOne({
		where: { username: username }
	})

	return dbUser ? dbUser.update({
		password, provider,
		familyName, givenName, middleName,
		emails: JSON.stringify(emails),
		photos: JSON.stringify(photos)
	}) : undefined;
}

exports.destroy =  async (username) => {
	const SQUser = await connectDb();
	const user = await SQUser.find({ where: { username: username } });
	if (!user) throw new Error('Did not find requested ' + username + ' to delete');
	user.destroy();
}

exports.userPasswordCheck = async (username, password) => {
	const SQUser = await connectDb();
	const user = await SQUser.find({ where: { username: username } });
	if (!user) {
		return { check: false, username: username, message: 'Could not find user' };
	} else if (user.username === username && user.password === password) {
		return { check: true, username: user.username };
	} else {
		return { check: false, username: username, message: 'Incorrect password' };
	}
}

exports.findOrCreate = async (profile) => {
	const user = await exports.find(profile.id);
	if (user) return user;

	return await exports.create(
		profile.id,
		profile.password,
		profile.provider,
		profile.familyName, profile.givenName, profile.middleName,
		profile.emails,
		profile.photos
	);
}

exports.listUsers = async () => {
    const SQUser = await connectDb()
    const userlist = await SQUser.findAll({})
    return userlist.map(user => exports.sanitizedUser(user))
}

exports.sanitizedUser = (user) => {
	var ret = {
		id: user.username, username: user.username,
		provider: user.provider,
		familyName: user.familyName, givenName: user.givenName,
		middleName: user.middleName
	}
	try {
		ret.emails = JSON.parse(user.emails)
	} catch (e) { ret.emails = [] }
	try {
		ret.photos = JSON.parse(user.photos)
	} catch (e) { ret.photos = [] }
	return ret
}