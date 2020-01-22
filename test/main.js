import './fixtures/fixtures.js';
import './samples/samples.js';
import { h } from 'preact';

window.h = h;
window.expect = global.require('chai').expect;