import { GenericResponse } from "./genericres";

export class RegisterBrandRequest {
    name: string;
    email: string;
    mobile: number;
}

export class RegisterBrandResponse extends GenericResponse { }

export class RegisterBrandEvent {
    text: string;
    constructor(text){this.text = text}
}