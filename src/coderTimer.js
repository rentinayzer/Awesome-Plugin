const vscode = require('vscode');

const pad = (n) => String(n).padStart(2, '0');

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmt(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

let ctx;
let timer; // { date, sec }
let item;
let interval;

function hasProject() {
  const f = vscode.workspace.workspaceFolders;
  return !!f && f.length > 0;
}

function save() {
  ctx.globalState.update('timer', timer);
}

function reset() {
  timer = { date: today(), sec: 0 };
  save();
  updateStatus();
}

function updateStatus() {
  if (hasProject()) {
    item.text = `$(clock) ${fmt(timer.sec)}`;
    item.tooltip = 'Время кодинга сегодня. Нажмите, чтобы сбросить';
  } else {
    item.text = `$(debug-pause) ${fmt(timer.sec)}`;
    item.tooltip = 'Откройте папку проекта, чтобы таймер заработал';
  }
}

function tick() {
  
  if (timer.date !== today()) {
    timer = { date: today(), sec: 0 };
  }
  
  if (hasProject()) {
    timer.sec++;
    if (timer.sec % 10 === 0) save();
  }
  updateStatus();
}

function activate(context) {
  ctx = context;
  timer = context.globalState.get('timer', { date: today(), sec: 0 });
  if (timer.date !== today()) {
    timer = { date: today(), sec: 0 };
  }

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'coderTimer.reset';
  item.show();
  updateStatus();

  context.subscriptions.push(
    item,
    vscode.commands.registerCommand('coderTimer.hello', () => {
      const name = vscode.workspace.getConfiguration('coderTimer').get('userName', 'Иван Иванов');
      vscode.window.showInformationMessage(`Hello, World! ${name}`);
    }),
    vscode.commands.registerCommand('coderTimer.reset', () => {
      reset();
      vscode.window.showInformationMessage('Таймер кодера сброшен');
    }),
    { dispose: () => { clearInterval(interval); save(); } }
  );

  interval = setInterval(tick, 1000);
}

function deactivate() {
  if (ctx) save();
}

module.exports = { activate, deactivate };
