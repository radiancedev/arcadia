const fs = require("fs");
const path = require("path");

try {
    const _ = require("@prisma/client"); 
    
    // Prisma is installed, so we'll use it as an ORM.
    // Replace the value in ORM.ts with the Prisma client.
    fs.writeFileSync(path.join(__dirname, "../src/orm/ORM.ts"), fs.readFileSync(path.join(__dirname, "../src/orm/ORM.prisma.ts"), "utf-8"), "utf8");
} catch (e) {
    throw e;
}