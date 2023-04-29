const fs = require("fs");
const path = require("path");

try {
    const _ = require("@prisma/client"); 
    
    // Prisma is installed, so we'll use it as an ORM.
    // Replace the value in ORM.ts with the following:
    const fileData = fs.readFileSync(path.join(__dirname, "../src/orm/ORM.ts"), "utf8");

    // Add the following line to the top of the file:
    // import { PrismaExtendedClient } from "./PrismaExtendedClient.orm.ts";
    fileData = "import { PrismaExtendedClient } from \"./PrismaExtendedClient.orm.ts\";\n" + fileData;

    // Replace (this._orm = {}) with (this._orm = new PrismaExtendedClient())
    fileData = fileData.replace("this._orm = {}", "this._orm = new PrismaExtendedClient()");

    // Replace any with PrismaExtendedClient
    fileData = fileData.replace(/any/g, "PrismaExtendedClient");

    // Save the file
    fs.writeFileSync(path.join(__dirname, "../src/orm/ORM.ts"), fileData, "utf8");
} catch (e) {
    console.log(e)
}