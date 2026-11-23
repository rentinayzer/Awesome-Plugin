const vscode = require('vscode');

function activate(context) {
  const commandId = 'hello.sayHello';

  const helloCommand = vscode.commands.registerCommand(commandId, () => {
    const name = vscode.workspace.getConfiguration('hello').get('userName', 'Иван Иванов');
    vscode.window.showInformationMessage(`Hello, World! ${name}`);
  });

  const helloButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  helloButton.text = '$(smiley) Hello World';
  helloButton.tooltip = 'Показать приветствие';
  helloButton.command = commandId;
  helloButton.show();

  context.subscriptions.push(helloCommand, helloButton);
}

function deactivate() {}

module.exports = { activate, deactivate };