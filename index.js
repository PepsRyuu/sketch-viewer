const electron = require('electron');
const {app, BrowserWindow} = electron;
const console = require('console');

require('electron-context-menu')();

let mainWindow;
app.console = new console.Console(process.stdout, process.stderr);
app.process = process;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {
    let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize

    mainWindow = new BrowserWindow({
        width: width, 
        height: height,
        title: 'Sketch Viewer',
        webPreferences: { experimentalFeatures: true }
    });

    mainWindow.setMenu(null);

    let url = 'file://' + __dirname + '/index.html';
    mainWindow.loadURL(url);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});