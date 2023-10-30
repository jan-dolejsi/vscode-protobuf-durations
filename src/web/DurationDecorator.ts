/*
 * Copyright (c) Jan Dolejsi 2023. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import { DecorationOptions, MarkdownString, Range, TextDocument, TextEditor, TextEditorDecorationType, window } from 'vscode';
import { DurationConverter } from './DurationConverter';
import { DurationLocation } from './DurationEditor';

const DOUBLE_QUOTED_SECONDS = /"(\d+)s"/g;

export class DurationDecorator {

    private timeout: NodeJS.Timer | undefined = undefined;
    protected decorations = new Map<TextEditor, TextEditorDecorationType[]>();
    
    public static readonly EDIT_COMMAND = "protobuf-durations.edit";

    constructor(private activeEditor: TextEditor | undefined) {
    }

    isActiveEditorDocument(document: TextDocument): boolean {
        return (this.activeEditor && document === this.activeEditor.document) ?? false;
    }
    
    isActiveEditor(editor: TextEditor): boolean {
        return editor === this.activeEditor;
    }

    setActiveEditor(editor: TextEditor) {
        this.activeEditor = editor;
        this.triggerUpdateDecorations();
    }
    isSupported(document: TextDocument): boolean {
        return document?.languageId === 'json';
    }

    updateDecorations() {
        if (!this.activeEditor) {
            return;
        }

        this.decorations.get(this.activeEditor)?.forEach(d => d.dispose());
        this.decorations.delete(this.activeEditor);
        const allDecorations: TextEditorDecorationType[] = [];
        this.decorations.set(this.activeEditor, allDecorations);

        for (const range of this.activeEditor.visibleRanges) {
            this.decorateRange(this.activeEditor, range, allDecorations);
        }
    }

    private decorateRange(activeEditor: TextEditor, range: Range, allDecorations: TextEditorDecorationType[]) {
        const baseIndex = activeEditor.document.offsetAt(range.start);
        const text = activeEditor.document.getText(range);
        let match;
        while ((match = DOUBLE_QUOTED_SECONDS.exec(text))) {
            const matchIndex = baseIndex + match.index;
            const startPos = activeEditor.document.positionAt(matchIndex);
            const endPos = activeEditor.document.positionAt(matchIndex + match[0].length);

            const seconds = Number.parseInt(match[1]);
            const dhms = DurationConverter.convertSecondsToFriendlyString(seconds);

            const commandArgs: DurationLocation = {
                documentUri: activeEditor.document.uri.toString(),
                origSeconds: seconds,
                offset: matchIndex + 1,
                length: match[1].length,
            };
            const hover = new MarkdownString(`${dhms} [edit](command:${DurationDecorator.EDIT_COMMAND}?${encodeURIComponent(JSON.stringify(commandArgs))})`);
            hover.isTrusted = true;

            const decorationRange: DecorationOptions = {
                range: new Range(startPos, endPos),
                hoverMessage: hover,
            };

            const decoration = window.createTextEditorDecorationType({
                after: {
                    contentText: " " + dhms,
                    textDecoration: "margin-left: 10px; font-style: italic; color: gray;",
                }
            });
            activeEditor.setDecorations(decoration, [decorationRange]);
            allDecorations.push(decoration);
        }
    }

    triggerUpdateDecorations(throttle = false) {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        if (throttle) {
            this.timeout = setTimeout(() => this.updateDecorations(), 500);
        } else {
            this.updateDecorations();
        }
    }
}
