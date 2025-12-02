# Rails View Navigator

Toggle seamlessly between Rails controller actions and their corresponding views.

## Features

- **Controller → View**: Place your cursor in a controller action and jump to the associated view
- **View → Controller**: From any view file, jump back to the controller action
- **Smart Path Detection**: Works with standard Rails apps and engine/domain structures
- **Multiple View Formats**: Supports ERB, HAML, Slim, Jbuilder, and Builder templates

## Usage

1. Open a Rails controller file and place your cursor inside an action method
2. Right-click and select "Go to View/Controller"
3. The corresponding view file will open

Or:

1. Open a Rails view file
2. Right-click and select "Go to View/Controller"
3. The controller will open and jump to the action method

You can also run the command from the Command Palette:
- `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Go to View/Controller"

## Supported File Patterns

**Controllers:**
- `*_controller.rb`

**Views:**
- `.html.erb`, `.html.haml`, `.html.slim`
- `.json.jbuilder`, `.json.erb`
- `.xml.builder`, `.xml.erb`
- `.js.erb`

**Rails Structures:**
- Standard Rails: `app/controllers/` ↔ `app/views/`
- Engines: `domains/*/app/controllers/` ↔ `domains/*/app/views/`
- Modular Apps: `apps/*/app/controllers/` ↔ `apps/*/app/views/`

## Installation

### From VSIX (Local Installation)

1. Download the `.vsix` file
2. Open VS Code/Cursor
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type "Install from VSIX"
5. Select the downloaded `.vsix` file

### From Source

1. Clone or download this repository
2. Open terminal in the extension directory
3. Run: `npm install -g @vscode/vsce` (if you don't have vsce installed)
4. Run: `vsce package`
5. Install the generated `.vsix` file using the steps above

### Publishing to Marketplace

To publish this extension to the VS Code Marketplace:

1. Create a publisher account at https://marketplace.visualstudio.com/
2. Get a Personal Access Token (PAT) from Azure DevOps
3. Update `publisher` field in `package.json` with your publisher name
4. Run: `vsce publish`

## Requirements

- VS Code or Cursor version 1.60.0 or higher
- A Rails project workspace

## Technical Features

- **Cross-platform**: Works on Windows, Mac, and Linux with proper path handling
- **Async file operations**: Non-blocking file system checks for better performance
- **Parallel path checking**: Tests multiple possible file locations simultaneously
- **Safe regex handling**: Properly escapes special characters in method names

## Known Limitations

- Requires standard Rails naming conventions
- Action method detection uses simple indentation heuristics (place cursor inside the method for best results)
- May not correctly detect actions within complex nested blocks or metaprogramming
- Partial templates are not currently supported

## Contributing

Issues and pull requests are welcome!

## License

MIT
