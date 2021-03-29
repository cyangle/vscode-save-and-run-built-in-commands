// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { RunOnSaveExtExtension } from "./runner";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-save-and-run-built-in-commands" is now active!');


  var extension = new RunOnSaveExtExtension(context);
  extension.showOutputMessage();

  vscode.workspace.onDidChangeConfiguration(() => {
    let disposeStatus = extension.showStatusMessage('Run On Save Ext: Reloading config.');
    extension.loadConfig();
    disposeStatus.dispose();
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable1 = vscode.commands.registerCommand('extension.saveAndRunExt.enable', () => {
    extension.isEnabled = true;
  });

  let disposable2 = vscode.commands.registerCommand('extension.saveAndRunExt.disable', () => {
    extension.isEnabled = false;
  });

  // vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
  // 	extension.runCommands(document.fileName);
  // });

  context.subscriptions.push(disposable1);
  context.subscriptions.push(disposable2);

  const watcher = vscode.workspace.createFileSystemWatcher(extension.watchFolderPath, false, false, false);
  let disposeStatus = extension.showStatusMessage(`Start watching: ${extension.watchFolderPath}`);
  disposeStatus.dispose();
  watcher.onDidChange((uri) => {
    extension.runCommands(uri.path);
  });
}

// this method is called when your extension is deactivated
export function deactivate() { }
