var db = require('apier-database');
var schemaExtender = require('mongoose-schema-extender');

var passwordSchema = new db.mongoose.Schema({
	site: {type: String, required: true},
	value: {type: db.mongoose.Schema.Types.Mixed, required: true},
	value2: {type: db.mongoose.Schema.Types.Mixed, required: true},
	userId: {
		type: db.mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	}
}, {
	collection: 'passwords'
});

// says which attributes each user role can see
passwordSchema.statics.permissions = function() {
	return {
		_id: ['member'],
		site: ['member'],
		value: ['member'],
		value2: ['member'],
		userId: ['member']
	};
};

passwordSchema.methods.create = function(req, res, save, populations) {
	return schemaExtender.create(req, res, db.mongoose, passwordSchema,
		'Password', save, populations);
};

passwordSchema.methods.findOne = function(req, res, query, populations) {
	return schemaExtender.findOne(req, res, db.mongoose, passwordSchema,
		'Password', query, populations);
};

passwordSchema.methods.findById = function(req, res, id) {
	return schemaExtender.findById(req, res, db.mongoose, passwordSchema,
		'Password', id);
};

passwordSchema.methods.findByIdAndRemove = function(req, res, id) {
	return schemaExtender.findByIdAndRemove(req, res, db.mongoose,
		passwordSchema, 'Password', id);
};

module.exports = db.mongoose.model('Password', passwordSchema);
