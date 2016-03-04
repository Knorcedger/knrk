require('../../schemas/passwordSchema');
require('../../schemas/userSchema');
var db = require('apier-database');
// var Password = db.mongoose.model('Password');
var User = db.mongoose.model('User');
var reqlog = require('reqlog');
var openpgp = require('openpgp');

module.exports = function(app) {
	app.endpoint({
		methods: ['get', 'post'],
		url: '/v1/passwords/test',
		permissions: ['null'],
		callback: function(req, res) {
			main(req, res, this);
		}
	});
};

/**
 * The main endpoint function
 * @method main
 * @param  {object} req The request object
 * @param  {object} res The response object
 * @param  {object} self Use self.send to send back data
 */
function main(req, res, self) {
	reqlog.info('passwords.search');

	var user = new User();
	var theuser;

	user.findById(req, res, '56d9ba8675218a055e9706f3')
		.then(function(result) {
			theuser = result;
			encrypt('power', theuser.publicKey, theuser.privateKey)
				.then(function(ciphertext) {
					decrypt(ciphertext.message.packets.write(), theuser.publicKey, theuser.privateKey)
						.then(function(decrypted) {
							console.log('decrypted', decrypted);
						}, function(error) {
							reqlog.error(error);
						});
				}, function(error) {
					reqlog.error(error);
				});
		});

	function encrypt(data, publicKey, privateKey) {
		var options = {
			data: new Uint8Array([0x01, 0x01, 0x01]),
			publicKeys: openpgp.key.readArmored(publicKey).keys,
			privateKeys: openpgp.key.readArmored(privateKey).keys,
			armor: false
		};

		return openpgp.encrypt(options);
	}

	function decrypt(encrypted, publicKey, privateKey) {
		// var key = openpgp.key.readArmored(privateKey).keys[0];
		// debugger;
		// openpgp.decryptKey(key, 'test')
		// 	.then(function(result) {
		// 		debugger;
		// 	}, function(error) {
		// 		debugger;
		// 	})
		var options = {
			message: openpgp.message.read(encrypted),             // parse encrypted bytes
			publicKeys: openpgp.key.readArmored(publicKey).keys,     // for verification (optional)
			privateKey: openpgp.key.readArmored(privateKey).keys[0], // for decryption
			format: 'binary'                                      // output as Uint8Array
		};

		return openpgp.decrypt(options);
	}
}
