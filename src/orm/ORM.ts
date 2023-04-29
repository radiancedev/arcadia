export class ORM {
    private _orm: any;

    constructor() {
        this._orm = {};
    }

    [key: keyof any]: any[keyof any]; 
}