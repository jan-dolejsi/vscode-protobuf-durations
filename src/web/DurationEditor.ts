/*
 * Copyright (c) Jan Dolejsi 2023. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

import { InputBoxValidationMessage, InputBoxValidationSeverity, Range, TextEditor, window } from 'vscode';
import { DurationConverter } from './DurationConverter';

export interface DurationLocation {
    documentUri: string;
    origSeconds: number;
    offset: number;
    length: number;
}

export async function editDuration(editor: TextEditor, durationLocation: DurationLocation): Promise<void> {
    const pattern = "1d2h3m4s";
    const editedValue = await window.showInputBox({
        placeHolder: pattern,
        value: DurationConverter.convertSecondsToEditableString(durationLocation.origSeconds),
        title: 'Modify the duration',
        prompt: `Use the ${pattern}`,
        validateInput: (value) => {
            const editedSeconds = DurationConverter.convertEditedStringToSeconds(value);
            if (editedSeconds !== null) {
                return null;
            } else {
                const message: InputBoxValidationMessage = {
                    message: `Use the ${pattern} pattern, or any subset.`,
                    severity: InputBoxValidationSeverity.Error,
                };
                return message;
            }
        },
    });

    if (editedValue) {
        const editedSeconds = DurationConverter.convertEditedStringToSeconds(editedValue);

        // which range to replace?
        const positionStart = editor.document.positionAt(durationLocation.offset);
        const positionEnd = editor.document.positionAt(durationLocation.offset + durationLocation.length);
        const range = new Range(positionStart, positionEnd);

        // let's ensure we do not overwrite something else
        const currentText = editor.document.getText(range);
        const origText = '' + durationLocation.origSeconds;
        if (currentText !== origText) {
            window.showErrorMessage(`Original value '${origText}' somehow meanwhile changed to become '${currentText}'`);
        } else {
            editor.edit(edit => edit.replace(range, '' + editedSeconds));
        }
    }
}