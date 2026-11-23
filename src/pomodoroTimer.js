const vscode = require('vscode');

const pad = (n) => String(n).padStart(2, '0');
const cfg = () => vscode.workspace.getConfiguration('pomodoro');

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtMin(sec) {
  return `${Math.floor(sec / 60)} мин ${sec % 60} с`;
}

let ctx;
let stats; // { 'YYYY-MM-DD': { pomodoros, workSec, breakSec } }
let state = { phase: 'idle', left: 0 }; // idle | work | break
let item;
let interval;

function dayStats() {
  const d = today();
  if (!stats[d]) {
    stats[d] = { pomodoros: 0, workSec: 0, breakSec: 0 };
  }
  return stats[d];
}

function save() {
  ctx.globalState.update('stats', stats);
}


function startWork() {
  state = { phase: 'work', left: Math.round(cfg().get('workMinutes', 1) * 60) };
  vscode.window.showInformationMessage('🍅 Работаем! Таймер запущен.');
  updateStatus();
}

function stop() {
  state = { phase: 'idle', left: 0 };
  save();
  updateStatus();
  vscode.window.showInformationMessage('Таймер остановлен');
}

function toggle() {
  if (state.phase === 'idle') startWork();
  else stop();
}

function nextPhase() {
  if (state.phase === 'work') {
    dayStats().pomodoros++;
    save();
    state = { phase: 'break', left: Math.round(cfg().get('breakMinutes', 1) * 60) };
    vscode.window.showInformationMessage('🍅 Помодоро завершён! Пора отдохнуть ☕');
  } else {
    state = { phase: 'idle', left: 0 };
    vscode.window
      .showInformationMessage('✅ Отдых закончен. Начать следующее помодоро?', 'Начать')
      .then((a) => a && startWork());
  }
  updateStatus();
}


function updateStatus() {
  if (state.phase === 'idle') {
    item.text = '$(play) 🍅 Старт';
    item.tooltip = 'Запустить помодоро';
    item.backgroundColor = undefined;
  } else {
    const icon = state.phase === 'work' ? '🍅' : '☕';
    item.text = `${icon} ${pad(Math.floor(state.left / 60))}:${pad(state.left % 60)}`;
    item.tooltip = (state.phase === 'work' ? 'Работа' : 'Отдых') + '. Нажмите, чтобы остановить';
    item.backgroundColor =
      state.phase === 'break' ? new vscode.ThemeColor('statusBarItem.warningBackground') : undefined;
  }
}

function tick() {
  if (state.phase === 'idle') return;

  const st = dayStats();
  if (state.phase === 'work') st.workSec++;
  else st.breakSec++;

  state.left--;
  if (state.left <= 0) {
    nextPhase();
  } else {
    updateStatus();
  }
  if (st.workSec % 10 === 0) save();
}


async function showStats() {
  const days = Object.keys(stats).sort().reverse().slice(0, 14);
  let md = '# Статистика помодоро по дням\n\n';
  if (days.length === 0) {
    md += 'Пока нет данных. Запустите таймер 🍅\n';
  } else {
    md += '| Дата | Помодоро | Время работы | Время отдыха |\n|---|---|---|---|\n';
    for (const d of days) {
      const s = stats[d];
      md += `| ${d} | ${s.pomodoros} | ${fmtMin(s.workSec)} | ${fmtMin(s.breakSec)} |\n`;
    }
  }
  const doc = await vscode.workspace.openTextDocument({ content: md, language: 'markdown' });
  vscode.window.showTextDocument(doc, { preview: true });
}


function activate(context) {
  ctx = context;
  stats = context.globalState.get('stats', {});

  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'pomodoro.toggle';
  item.show();
  updateStatus();

  context.subscriptions.push(
    item,
    vscode.commands.registerCommand('pomodoro.toggle', toggle),
    vscode.commands.registerCommand('pomodoro.showStats', showStats),
    { dispose: () => { clearInterval(interval); save(); } }
  );

  interval = setInterval(tick, 1000);
}

function deactivate() {
  if (ctx) save();
}

module.exports = { activate, deactivate };
