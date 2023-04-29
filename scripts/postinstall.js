const fs = require("fs");
const path = require("path");

const prismaORMCode = `import { PrismaClient } from "@prisma/client";

export class ORM extends PrismaClient {
    public omit<T, K extends keyof T>(obj: T | undefined, keys: K[]): Omit<T, K> {
        if (!obj) {
            return {} as Omit<T, K>;
        }

        const ret: Record<keyof T, any> | undefined = obj;
        for (let key of Object.keys(obj)) {
            if (keys.includes(key as K)) {
                delete ret?.[key as keyof T];
            }
        }

        return ret;
    }
}
`;

try {
    // npm query for @prisma/client
    // access node_modules from here
    const prismaClientPath = path.join(__dirname, "../../.prisma/");
    
    if (!fs.existsSync(prismaClientPath)) {
        // Prisma is not installed.
        return;
    }
    
    // If we get here, Prisma is installed.
    
    // Prisma is installed, so we'll use it as an ORM.
    // Replace the value in ORM.ts with the Prisma client.
    fs.writeFileSync(path.join(__dirname, "../src/orm/ORM.ts"), prismaORMCode, "utf8");
} catch (e) {
    console.log(e)
}