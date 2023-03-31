import { Controller } from "../../src/structures/Controller";
import { Context } from "../../src/structures/types/Context";

export class TestController extends Controller {
    async test(ctx: Context) {
        console.log("Hi");
        
        return { 
            message: "Hello, world!"
        }
    }
}