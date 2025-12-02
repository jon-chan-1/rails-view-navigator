const vscode = require('vscode');
const path = require('path');
const fs = require('fs').promises;

// Constants
const VIEW_EXTENSIONS = [
    '.html.erb', '.html.haml', '.html.slim',
    '.json.jbuilder', '.json.erb',
    '.xml.builder', '.xml.erb',
    '.js.erb', '.text.erb'
];

/**
 * Normalize path to use forward slashes (cross-platform compatibility)
 */
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    let disposable = vscode.commands.registerCommand('railsViewNavigator.toggleView', async function () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        const filePath = normalizePath(document.fileName);
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

        if (!workspaceFolder) {
            vscode.window.showErrorMessage('File is not in a workspace');
            return;
        }

        const workspacePath = normalizePath(workspaceFolder.uri.fsPath);

        // Determine if we're in a controller or view
        if (filePath.endsWith('_controller.rb')) {
            // We're in a controller, navigate to view
            await navigateToView(editor, workspacePath, filePath);
        } else if (filePath.match(/\.(html|json|xml|js|text)\.(erb|haml|slim|builder|jbuilder)$/) ||
                   filePath.match(/\/views\/.*\.(html|json|xml|js|text)$/)) {
            // We're in a view, navigate to controller
            await navigateToController(editor, workspacePath, filePath);
        } else {
            vscode.window.showErrorMessage('Not in a Rails controller or view file');
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Check if file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Find first existing file from a list of paths (checked in parallel)
 */
async function findExistingFile(paths) {
    const checks = await Promise.allSettled(
        paths.map(async (p) => {
            const exists = await fileExists(p);
            return exists ? p : Promise.reject();
        })
    );

    const firstExisting = checks.find(r => r.status === 'fulfilled');
    return firstExisting ? firstExisting.value : null;
}

/**
 * Build view file paths for a given controller and action
 */
function buildViewPaths(workspacePath, controllerName, actionName) {
    const viewPaths = [];

    // Standard Rails: app/views/controller_name/action.html.erb
    for (const ext of VIEW_EXTENSIONS) {
        viewPaths.push(path.join(workspacePath, 'app', 'views', controllerName, `${actionName}${ext}`));
    }

    // Check in engines/domains/apps (for modular Rails apps)
    // These keep the full namespace: domains/cms/app/views/cms/emr/orders/
    const domainMatch = controllerName.match(/^([^\/]+)\//);
    if (domainMatch) {
        const domain = domainMatch[1];

        for (const ext of VIEW_EXTENSIONS) {
            // domains/cms/app/views/cms/emr/orders/index.html.erb
            viewPaths.push(path.join(workspacePath, 'domains', domain, 'app', 'views', controllerName, `${actionName}${ext}`));
            // apps/cms/app/views/cms/emr/orders/index.html.erb
            viewPaths.push(path.join(workspacePath, 'apps', domain, 'app', 'views', controllerName, `${actionName}${ext}`));
        }
    }

    return viewPaths;
}

/**
 * Build controller file paths for a given controller name
 */
function buildControllerPaths(workspacePath, controllerName) {
    const controllerPaths = [
        path.join(workspacePath, 'app', 'controllers', `${controllerName}_controller.rb`),
    ];

    // Check in engines/domains/apps
    const domainMatch = controllerName.match(/^([^\/]+)\//);
    if (domainMatch) {
        const domain = domainMatch[1];

        controllerPaths.push(
            path.join(workspacePath, 'domains', domain, 'app', 'controllers', `${controllerName}_controller.rb`)
        );
        controllerPaths.push(
            path.join(workspacePath, 'apps', domain, 'app', 'controllers', `${controllerName}_controller.rb`)
        );
    }

    return controllerPaths;
}

async function navigateToView(editor, workspacePath, controllerPath) {
    const document = editor.document;
    const position = editor.selection.active;

    // Extract controller name from file path
    const controllerMatch = controllerPath.match(/\/controllers\/(.+)_controller\.rb$/);
    if (!controllerMatch) {
        vscode.window.showErrorMessage(`Could not parse controller path: ${controllerPath}`);
        return;
    }

    const controllerName = controllerMatch[1]; // e.g., "cms/emr/cached_patient_pending_orders"

    // Find the action method at cursor or search upward
    const actionName = findActionAtPosition(document, position);
    if (!actionName) {
        vscode.window.showErrorMessage('Could not find action method. Place cursor inside an action method.');
        return;
    }

    // Build and check view paths
    const viewPaths = buildViewPaths(workspacePath, controllerName, actionName);
    const existingView = await findExistingFile(viewPaths);

    if (existingView) {
        const doc = await vscode.workspace.openTextDocument(existingView);
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Opened view: ${actionName}`);
    } else {
        vscode.window.showErrorMessage(`No view found for ${controllerName}#${actionName}`);
    }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Jump to action method definition in controller
 */
async function jumpToAction(editor, document, actionName) {
    const text = document.getText();
    const escapedAction = escapeRegex(actionName);
    const actionRegex = new RegExp(`^\\s*def\\s+${escapedAction}\\b`, 'm');
    const match = actionRegex.exec(text);

    if (match) {
        const position = document.positionAt(match.index);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        return true;
    }
    return false;
}

async function navigateToController(editor, workspacePath, viewPath) {
    // Extract controller and action from view path
    // e.g., /app/views/cms/emr/cached_patient_pending_orders/index.html.erb
    const viewMatch = viewPath.match(/\/views\/(.+?)\/([^\/]+)\.(html|json|xml|js|text)/);
    if (!viewMatch) {
        vscode.window.showErrorMessage(`Could not parse view path: ${viewPath}`);
        return;
    }

    const controllerName = viewMatch[1]; // e.g., "cms/emr/cached_patient_pending_orders"
    const actionName = viewMatch[2].replace(/\.(erb|haml|slim|builder|jbuilder)$/, ''); // e.g., "index"

    // Build and check controller paths
    const controllerPaths = buildControllerPaths(workspacePath, controllerName);
    const existingController = await findExistingFile(controllerPaths);

    if (existingController) {
        const doc = await vscode.workspace.openTextDocument(existingController);
        const newEditor = await vscode.window.showTextDocument(doc);

        // Try to find and jump to the action method
        const found = await jumpToAction(newEditor, doc, actionName);
        if (found) {
            vscode.window.showInformationMessage(`Jumped to action: ${actionName}`);
        } else {
            vscode.window.showInformationMessage(`Opened controller (action ${actionName} not found)`);
        }
    } else {
        vscode.window.showErrorMessage(`No controller found for ${controllerName}`);
    }
}

/**
 * Find the action method at the current cursor position
 *
 * Limitation: Uses simple indentation heuristics. May not correctly handle all cases
 * such as nested blocks (if/case/end), one-liner methods, or complex metaprogramming.
 * For best results, place cursor inside the method body.
 */
function findActionAtPosition(document, position) {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Search backward for 'def method_name'
    const beforeCursor = text.substring(0, offset);
    const defMatches = [...beforeCursor.matchAll(/^\s*def\s+(\w+)/gm)];

    if (defMatches.length === 0) {
        return null;
    }

    // Get the last 'def' before cursor
    const lastDef = defMatches[defMatches.length - 1];
    const defPosition = lastDef.index;
    const methodName = lastDef[1];

    // Check if we've passed an 'end' keyword that closes this method
    const betweenDefAndCursor = text.substring(defPosition, offset);
    const endMatch = betweenDefAndCursor.match(/^\s*end\s*$/m);

    if (endMatch) {
        // Check indentation levels to determine if this 'end' closes the method
        // Note: This won't catch 'end' keywords from if/case/block statements
        const defLine = document.lineAt(document.positionAt(defPosition));
        const defIndent = defLine.text.match(/^\s*/)[0].length;

        const endLine = document.lineAt(document.positionAt(defPosition + endMatch.index));
        const endIndent = endLine.text.match(/^\s*/)[0].length;

        if (endIndent <= defIndent) {
            return null; // We're past the method
        }
    }

    return methodName;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
