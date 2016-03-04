require('../../schemas/passwordSchema');
var db = require('apier-database');
var Password = db.mongoose.model('Password');
var reqlog = require('reqlog');
var validationsRunner = require('apier-validationsrunner');
var openpgp = require('openpgp');

module.exports = function(app) {
	app.endpoint({
		methods: ['get', 'post'],
		url: '/v1/passwords/search',
		permissions: ['member'],
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
		site: {
			EMPTY: req.requestData.site,
			WRONG: function(req, resolve) {
				var password = new Password();

				password.findOne(req, res, {
					site: req.requestData.site,
					userId: req.activeUser._id
				})
					.then(function(result) {
						if (result) {
							req.password = result;
							resolve(true);
						} else {
							resolve(false);
						}
					}, function() {
						resolve(false);
					});
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
	reqlog.info('passwords.search');

	// self.send('true');

// debugger;
	decrypt(req.password.value.message.packets[0].encrypted, req.activeUser.publicKey,
		req.requestData.privateKey)
		.then(function(ciphertext) {
			self.send(ciphertext);
			// self.send(ciphertext);
		});
	//
	// decrypt(req.password.value2, req.activeUser.publicKey,
	// 	req.requestData.privateKey)
	// 	.then(function(ciphertext) {
	// 		console.log(ciphertext);
	// 		// self.send(ciphertext);
	// 	});
}

function decrypt(encrypted, publicKey, privateKey) {
	var options = {
		message: openpgp.message.read(encrypted),
		publicKeys: openpgp.key.readArmored(publicKey).keys,
		privateKeys: openpgp.key.readArmored(privateKey).keys[0],
		format: 'binary'
	};

	return openpgp.decrypt(options);
}
