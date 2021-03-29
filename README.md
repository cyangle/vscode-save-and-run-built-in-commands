# vscode-save-and-run-built-in-commands README

Run vscode built in commands or shell commands on file changes.

## Features

- Configure multiple commands (terminal or command from VS Code extension) that run when a file is saved
- Regex pattern matching for files that trigger commands running

## Configuration

Add "saveAndRunExt" configuration to user or workspace settings.

- "watchFolderPath" - folder path to watch for file changes
- "commands" - array of commands that will be run whenever a file is saved.
	- "terminalName" - name of the terminal to run commands
  - "match" - a regex for matching which files to run commands on
  - "cmd" - array of shell or built in commands to run. Can include parameters that will be replaced at runtime (see Placeholder Tokens section below).
  - "isShellCommand": true - boolean to run command in shell or as built in command.

## Sample Config

```json
"saveAndRunExt": {
  "watchFolderPath": "**/run/*",
	"commands": [
		{
			"match": ".*/test\\.js",
			"terminalName": "run_on_change",
			"isShellCommand": false,
			"cmd": ["myExtension.amazingCommand"]
		},
		{
			"match": ".*\\.txt$",
			"terminalName": "run_on_change",
			"isShellCommand": true,
			"cmd": ["echo 'Executed in the terminal: I am a .txt file ${file}.'"]
		}
	]
}
```

## Commands

The following commands are exposed in the command palette

- `Save and Run Ext : Enable`
- `Save and Run Ext : Disable`


## Placeholder Tokens

Commands support placeholders similar to tasks.json.

- `${workspaceRoot}`: workspace root folder
- `${file}`: path of saved file
- `${relativeFile}`: relative path of saved file
- `${fileBasename}`: saved file's basename
- `${fileDirname}`: directory name of saved file
- `${fileExtname}`: extension (including .) of saved file
- `${fileBasenameNoExt}`: saved file's basename without extension
- `${cwd}`: current working directory

### Environment Variable Tokens

- `${env.Name}`

## License

Apache 2.0
