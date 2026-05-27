export class Professor {
  private _id: number;
  private _names: string;
  private _lastNames: string;

  constructor(id: number, names: string, lastNames: string) {
    this._id = id;
    this._names = names;
    this._lastNames = lastNames;
  }

  get names(): string {
    return this._names;
  }

  get lastNames(): string {
    return this._lastNames;
  }

  get id(): number {
    return this._id;
  }

  get fullName(): string {
    return `${this._names} ${this._lastNames}`;
  }
}
