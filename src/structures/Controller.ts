import { ContextFunction } from "../routes/Route";

export class Controller {
    public static SELF: Controller;

    [key: string]: ContextFunction | Function; // This is required.
}