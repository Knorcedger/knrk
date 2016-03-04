var requestModule = require('supertest-as-promised');

exports.request = requestModule('http://localhost:2000/v1');

exports.secret = 'lD8}QF75XrWZTfu';
