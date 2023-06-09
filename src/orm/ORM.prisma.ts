import { PrismaClient } from "@prisma/client";

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