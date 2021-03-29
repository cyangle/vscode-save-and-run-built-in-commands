import * as vscode from "vscode";
import * as path from 'path';
var ncp = require("copy-paste");
var endOfLine = require('os').EOL;


interface ICommand {
	match?: string;
	notMatch?: string;
	cmd: Array<string>;
	isAsync: boolean;
	isShellCommand: boolean;

}

interface IConfig {
	shell: string;
	autoClearConsole: boolean;
	watchFolderPath: string;
	commands: Array<ICommand>;
}

export class RunOnSaveExtExtension {
	private outputChannel: vscode.OutputChannel;
	private context: vscode.ExtensionContext;
	private config: IConfig;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.outputChannel = vscode.window.createOutputChannel('Run On Save Ext');
		this.config = <IConfig><any>vscode.workspace.getConfiguration('saveAndRunExt');
	}

	private runInTerminal(command: Array<string>) {
		ncp.copy(command.join(";" + endOfLine) + endOfLine, function () {
			vscode.commands.executeCommand("workbench.action.terminal.focus").then(() => {
				vscode.commands.executeCommand("workbench.action.terminal.paste").then(() => {
					var editor = vscode.window.activeTextEditor;
					if (editor === undefined) {
						console.log("editor is undefined!");
					} else {
						vscode.window.showTextDocument(editor.document, editor.viewColumn);
					}
				});
			});
		});
	}

	private runAll(commands: ICommand[]): void {
		commands.forEach(command => {
			if (command.isShellCommand) {
				this.runInTerminal(command.cmd);
			}
			else {
				command.cmd.forEach((cmd) => {
					vscode.commands.executeCommand(cmd);
				});
			}
		});
	}

	public get isEnabled(): boolean {
		return !!this.context.globalState.get('isEnabled', true);
	}
	public set isEnabled(value: boolean) {
		this.context.globalState.update('isEnabled', value);
		this.showOutputMessage();
	}

	public get shell(): string {
		return this.config.shell;
	}

	public get autoClearConsole(): boolean {
		return !!this.config.autoClearConsole;
	}

	public get commands(): Array<ICommand> {
		return this.config.commands || [];
	}

	public get watchFolderPath(): string {
		return this.config.watchFolderPath || "./";
	}

	public loadConfig(): void {
		this.config = <IConfig><any>vscode.workspace.getConfiguration('saveAndRunExt');
	}

	public showOutputMessage(message?: string): void {
		message = message || `Run On Save Ext ${this.isEnabled ? 'enabled' : 'disabled'}.`;
		this.outputChannel.appendLine(message);
	}

	public showStatusMessage(message: string): vscode.Disposable {
		this.showOutputMessage(message);
		return vscode.window.setStatusBarMessage(message);
	}

	public runCommands(fileName: string): void {
		if (this.autoClearConsole) {
			this.outputChannel.clear();
		}

		if (!this.isEnabled || this.commands.length === 0) {
			this.showOutputMessage();
			return;
		}

		this.showOutputMessage(`File changed at: ${fileName}`);

		var match = (pattern: string) => pattern && pattern.length > 0 && new RegExp(pattern).test(fileName);

		var commandConfigs = this.commands
			.filter(cfg => {
				var matchPattern = cfg.match || '';
				var negatePattern = cfg.notMatch || '';

				// if no match pattern was provided, or if match pattern succeeds
				var isMatch = matchPattern.length === 0 || match(matchPattern);

				// negation has to be explicitly provided
				var isNegate = negatePattern.length > 0 && match(negatePattern);

				// negation wins over match
				return !isNegate && isMatch;
			});

		if (commandConfigs.length === 0) {
			return;
		}

		this.showStatusMessage('Running on save commands...');

		// build our commands by replacing parameters with values
		var commands: Array<ICommand> = [];
		for (let cfg of commandConfigs) {
			var cmdStrs = cfg.cmd;

			var extName = path.extname(fileName);

			var root = vscode.workspace.rootPath;
			var relativeFile = "." + fileName;
			if (root !== undefined) {
				relativeFile = "." + fileName.replace(root, "");
			}

			var results = cmdStrs.map((cmdStr) => {
				cmdStr = cmdStr.replace(/\${relativeFile}/g, relativeFile);
				cmdStr = cmdStr.replace(/\${file}/g, `${fileName}`);
				cmdStr = cmdStr.replace(/\${workspaceRoot}/g, `${vscode.workspace.rootPath}`);
				cmdStr = cmdStr.replace(/\${fileBasename}/g, `${path.basename(fileName)}`);
				cmdStr = cmdStr.replace(/\${fileDirname}/g, `${path.dirname(fileName)}`);
				cmdStr = cmdStr.replace(/\${fileExtname}/g, `${extName}`);
				cmdStr = cmdStr.replace(/\${fileBasenameNoExt}/g, `${path.basename(fileName, extName)}`);
				cmdStr = cmdStr.replace(/\${cwd}/g, `${process.cwd()}`);

				// replace environment variables ${env.Name}
				cmdStr = cmdStr.replace(/\${env\.([^}]+)}/g, (sub: string, envName: string) => {
					return process.env[envName] || "";
				});
				return cmdStr;
			});

			commands.push({
				cmd: results,
				isAsync: !!cfg.isAsync,
				isShellCommand: !!((cfg.isShellCommand === false) ? false : true)
			});
		}

		//this._runCommands(commands);
		this.runAll(commands);
	}
}
