/*
 * Copyright (c) Jan Dolejsi 2023. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
'use strict';

export class DurationConverter {

  private elements: DurationElement[] = [];

  private constructor(seconds: number) {
    this.add("day", Math.floor(seconds / (3600 * 24)));
    this.add("hour", Math.floor(seconds % (3600 * 24) / 3600));
    this.add("minute", Math.floor(seconds % 3600 / 60));
    this.add("second", Math.floor(seconds % 60));

    if (seconds / (3600 * 24) > 500) {
      this.addApproximate("year", seconds / (3600 * 24 * 365.25));
    }
  }

  add(unit: string, amount: number): void {
    if (amount === 1) {
      this.elements.push(new DurationElement(unit, amount));
    } else if (amount > 0) {
      this.elements.push(new DurationElement(unit + 's', amount));
    }
  }

  addApproximate(unit: string, amount: number): void {
    this.elements.push(new ApproxDurationElement(unit, amount));
  }

  public toFriendlyString(): string {
    return this.elements.map(e => e.toFriendlyString()).join(', ');
  }

  public toEditableString(): string {
    return this.elements.map(e => e.toEditableString()).join('');
  }

  static convertSecondsToFriendlyString(seconds: number): string {
    return new DurationConverter(seconds).toFriendlyString();
  }

  static convertSecondsToEditableString(seconds: number): string {
    return new DurationConverter(seconds).toEditableString();
  }

  static convertEditedStringToSeconds(editedString: string): number | null {
    const regEx = /^((\d+)d)?((\d+)h)?((\d+)m)?((\d+)s)?$/i;
    const match = regEx.exec(editedString);
    if (match) {
      let totalSeconds = 0;
      if (match[2]) {
        const days = Number.parseInt(match[2]);
        totalSeconds += days * 60 * 60 * 24;
      }

      if (match[4]) {
        const hours = Number.parseInt(match[4]);
        totalSeconds += hours * 60 * 60;
      }

      if (match[6]) {
        const minutes = Number.parseInt(match[6]);
        totalSeconds += minutes * 60;
      }

      if (match[8]) {
        const seconds = Number.parseInt(match[8]);
        totalSeconds += seconds;
      }

      return totalSeconds;
    }

    return null;
  }
}

class DurationElement {

  constructor(protected readonly unit: string, protected readonly amount: number) {
  }

  public toFriendlyString(): string {
    return `${this.amount} ${this.unit}`;
  }

  public toEditableString(): string {
    return `${this.amount}${this.unit.substring(0, 1)}`;
  }
}

class ApproxDurationElement extends DurationElement {

  public toFriendlyString(): string {
    const rounded = Math.round(this.amount * 10) / 10;
    return `~${rounded} ${this.unit}s`;
  }

  public toEditableString(): string {
    return ''; // does not participate in editing
  }
}