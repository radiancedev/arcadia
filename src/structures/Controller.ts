import { ContextFunction } from "../routes/Route";

export class Controller {
    public static SELF: Controller;

    [key: string]: ContextFunction; // This is required.
}