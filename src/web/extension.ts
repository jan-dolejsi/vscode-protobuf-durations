/*
 * Copyright (c) Jan Dolejsi 2023. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import * as vscode from 'vscode';
import { DurationDecorator } from './DurationDecorator';
import { DurationLocation, editDuration } from './DurationEditor';

// This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log(`Extension "${context.extension.id}" is now active in the web extension host!`);

	const decorator = new DurationDecorator(vscode.window.activeTextEditor);

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor && decorator.isSupported(editor?.document)) {
			decorator.setActiveEditor(editor);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (decorator.isActiveEditorDocument(event.document)) {
			decorator.triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

	vscode.window.onDidChangeTextEditorVisibleRanges(event => {
		if (decorator.isActiveEditor(event.textEditor)) {
			decorator.triggerUpdateDecorations(true);
		}
	}, null, context.subscriptions);

	decorator.triggerUpdateDecorations();

	const disposable = vscode.commands.registerCommand(DurationDecorator.EDIT_COMMAND, (durationLocation: DurationLocation) => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && decodeURIComponent(activeEditor?.document.uri.toString()) === durationLocation.documentUri) {
			editDuration(activeEditor, durationLocation);
		} else {
			vscode.window.showErrorMessage("Unexpected active document editor.");
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	// Noop
}
