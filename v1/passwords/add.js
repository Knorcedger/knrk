require('../../schemas/passwordSchema');
var db = require('apier-database');
var Password = db.mongoose.model('Password');
var reqlog = require('reqlog');
var validationsRunner = require('apier-validationsrunner');
var openpgp = require('openpgp');

module.exports = function(app) {
	app.endpoint({
		methods: ['get', 'post'],
		url: '/v1/passwords/add',
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
			EMPTY: req.requestData.site
		},
		data: {
			EMPTY: req.requestData.data
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

	var password = new Password();

	encrypt(req.requestData.data, req.activeUser.publicKey,
		req.requestData.privateKey)
		.then(function(ciphertext) {
			password.create(req, res, {
				site: req.requestData.site,
				value: ciphertext,
				value2: ciphertext.message.packets.write(),
				userId: req.activeUser._id
			}).then(function(result) {
				self.send(result);
			});
		});
}

function encrypt(data, publicKey, privateKey) {
	var options = {
		data: data,
		publicKeys: openpgp.key.readArmored(publicKey).keys,
		privateKeys: openpgp.key.readArmored(privateKey).keys,
		armor: false
	};

	return openpgp.encrypt(options);
}
