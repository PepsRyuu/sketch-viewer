process.env.NODE_ENV = 'test';
require('../src/bootstrap');
window.expect = require('chai').expect;
window.h = require('preact').h;