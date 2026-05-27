import { Professor } from "./Professor";
import { Subject } from "./Subject";
import { Session } from "./Session";

export class Course {
  private _id: number;
  private _subject: Subject;
  private _group: string;
  private _professor: Professor;
  private _sessions: Session[] = [];
  private _modality: string;
  private _weekHours: number;
  private _acceptModifications: boolean;


  constructor(
    id: number,
    subject: Subject,
    professor: Professor,
    group: string,
    modality: string,
    weekHours: number,
    acceptModifications: boolean
  ) {
    this._weekHours = weekHours;
    this._acceptModifications = acceptModifications;
    this._id = id;
    this._subject = subject;
    this._professor = professor;
    this._group = group ?? "";
    this._modality = modality ?? "";
  }

  get modality() {
    return this._modality;
  }

  get subject() {
    return this._subject;
  }

  get professor() {
    return this._professor;
  }
  public get sessions(): Session[] {
    return this._sessions;
  }

  public get group(): string {
    return this._group;
  }

  public get id(): number {
    return this._id;
  }

  public get weekHours(): number {
    return this._weekHours;
  }

  public get acceptModifications(): boolean {
    return this._acceptModifications;
  }

  public set sessions(sessions: Session[]) {
    this._sessions = sessions;
  }

  public addSession(session: Session): void {
    this._sessions.push(session);
  }

}
