// Isolate all Node calls here
// Have to use global because Nollup will think it's a local require.
let electron = global.require('electron');
let fs = global.require('fs');
let path = global.require('path');
let os = global.require('os');
let jszip = global.require('jszip');
let paper = global.require('paper');
let plist = global.require('bplist-parser');

export {
	electron,
	fs,
	path,
	os,
	jszip,
	paper,
	plist
};