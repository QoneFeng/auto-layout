const { app } = require('electron');
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity,WinSboxDisableExtensionPoints');
app.whenReady().then(() => {
  process.stdout.write(`electron-ready ${process.versions.electron}\n`);
  app.quit();
});
