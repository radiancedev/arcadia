
import { Application } from '../src/Application';
import { Route } from '../src/routes/Route';
import { Context } from '../src/structures/types/Context';

const app = new Application();
const route = new Route();

route.group("/hi", (route) => {
    route.preprocess(async(ctx) => {
        console.log("Hi :3");
    });

    route.get("/test", async(ctx: Context) => {
        
    }, "TestController@test");
    route.view("/test2", "comedy");
})

app.register(route);
app.listen(3000);
