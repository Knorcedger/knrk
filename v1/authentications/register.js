require('../../schemas/userSchema');
var db = require('apier-database');
var User = db.mongoose.model('User');
var reqlog = require('reqlog');
var validationsRunner = require('apier-validationsrunner');
var validator = require('validator');
var crypto = require('crypto');
var openpgp = require('openpgp');

module.exports = function(app) {
	app.endpoint({
		methods: ['get', 'post'],
		url: '/v1/authentications/register',
		permissions: ['null'],
		middlewares: [validate],
		callback: function(req, res) {
			main(req, res, this);
		}
	});
};

/**
 * The endpoint validations middleware
 * @method validate
 * @param  {object}   req  The request object
 * @param  {object}   res  The response object
 * @param  {Function} next The next function
 */
function validate(req, res, next) {
	var validations = {
		username: {
			INVALID_LENGTH: function(req, resolve) {
				var username = req.requestData.username;
				if (username && username.length >= 4) {
					resolve(true);
				} else {
					resolve(false);
				}
			}
		},
		password: {
			INVALID_LENGTH: function(req, resolve) {
				var password = req.requestData.password;
				if (password && password.length >= 4) {
					resolve(true);
				} else {
					resolve(false);
				}
			}
		},
		email: {
			INVALID: function(req, resolve) {
				if (req.requestData.email &&
				validator.isEmail(req.requestData.email)) {
					resolve(true);
				} else {
					resolve(false);
				}
			}
		}
	};

	validationsRunner(req, res, next, validations);
}

/**
 * The main endpoint function
 * @method main
 * @param  {object} req The request object
 * @param  {object} res The response object
 * @param  {object} self Use self.send to send back data
 */
function main(req, res, self) {
	reqlog.info('authentications.register');

	var user = new User();

	getKeys(req.requestData.username, req.requestData.email,
		req.requestData.password, req.requestData.passphrase)
		.then(function(key) {
			console.log('in');
			var privateKey = key.privateKeyArmored;
			var publicKey = key.publicKeyArmored;

			user.create(req, res, {
				username: req.requestData.username,
				password: crypto
					.createHash('sha512')
					.update(req.requestData.password)
					.digest('hex'),
				email: req.requestData.email,
				privateKey: privateKey,
				publicKey: publicKey,
				type: 'member'
			}).then(function(result) {
				self.send(result);
			});
		});
}

function getKeys(username, email, password, passphrase) {
	var options = {
		userIds: [{
			name: username + getRandom(),
			email: email
		}],
		numBits: 4096,
		passphrase: passphrase
	};

	return openpgp.generateKey(options);
}

/**
 * Get a random 9 digit number
 * @method getRandom
 * @return {number}  The number
 */
function getRandom() {
	return Math.floor(100000000 + Math.random() * 900000000);
}
