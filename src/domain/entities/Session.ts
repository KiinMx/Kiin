export class Session {

    private _day: string;
    private _startHour: number;
    private _endHour: number;
    private _room: string;

    constructor(day: string, startHour: number, endHour: number, room: string) {
        this._day = day;
        this._startHour = startHour;
        this._endHour = endHour;
        this._room = room;
    }

    get day(): string {
        return this._day;
    }
    get startHour(): number {
        return this._startHour;
    }
    get endHour(): number {
        return this._endHour;
    }
    get room(): string {
        return this._room;
    }

    get startHourFormatted(): string {
        return Session.formatMinutes(this._startHour);
    }

    get endHourFormatted(): string {
        return Session.formatMinutes(this._endHour);
    }

    get hours(): number {
        return Math.floor(this._startHour / 60);
    }

    get minutes(): number {
        return this._startHour % 60;
    }

    get endHours(): number {
        return Math.floor(this._endHour / 60);
    }

    get endMinutes(): number {
        return this._endHour % 60;
    }

    static formatMinutes(totalMinutes: number): string {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    static fromTimeString(time: string): number {
        const parts = time.split(':');
        return Number(parts[0]) * 60 + Number(parts[1]);
    }
}