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

## Contributing

Issues and pull requests are welcome!

## License

MIT
