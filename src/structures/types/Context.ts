// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import e, { Request, Response as ExpressResponse } from 'express';
import { MediaType, ParamsDictionary, Application, Response, NextFunction } from 'express-serve-static-core';
import { IncomingHttpHeaders } from 'http';
import { Socket } from 'net';
import { ParsedQs } from 'qs';
import { Options, Ranges, Result } from 'range-parser';
import { Application as ArcadiaApplication } from '../../Application';

// Ignore the error, it's a horrible way to get the Request object to work.
export class Context implements e.Request {
    private _response: Response;
    private _prisma: PrismaClient?;

    constructor(request: Request, response: ExpressResponse) {
        this._response = response;

        // Copy all properties from the request to this object.
        Object.assign(this, request);
    }

    get response() {
        return this._response;
    }

    get prisma() {
        try {
            if (this._prisma === undefined)
                this._prisma = new PrismaClient();

            return this._prisma;
        } catch {
            return null;
        }
    }

    has(key: keyof Context, values: string[]): boolean {
        // If the key doesn't exist, return false.
        if (this[key] === undefined) return false;

        // If the key exists and there are no values, return true.
        if (values.length === 0) return true;

        // If the key exists and there are values, check if the values exist.
        return this[key] !== undefined && values.every((value) => this[key][value] !== undefined);
    }

    missing(key: keyof Context, values: string[]): string[] {
        // get all missing keys
        const missing = [];

        for (const value of values) {
            if (this[key][value] === undefined) missing.push(value);
        }
        
        return missing;
    }

    async render(view: string, data?: object) {
        return await ArcadiaApplication.SELF.context.views.render(view, data);
    }

    async view(view: string, data?: object) {
        // Render the view.
        const html = await this.render(view, data);

        this.response.send(html);
    }

    status(code: number) {
        this.response.status(code);

        return this;
    }

    // e.Request properties
    get(name: 'set-cookie'): string[] | undefined;
    get(name: string): string | undefined;
    get(name: unknown): string | string[] | undefined {
        throw new Error('Method not implemented.');
    }
    header(name: 'set-cookie'): string[] | undefined;
    header(name: string): string | undefined;
    header(name: unknown): string | string[] | undefined {
        throw new Error('Method not implemented.');
    }
    accepts(): string[];
    accepts(type: string): string | false;
    accepts(type: string[]): string | false;
    accepts(...type: string[]): string | false;
    accepts(type?: unknown, ...rest?: unknown[]): string | false | string[] {
        throw new Error('Method not implemented.');
    }
    acceptsCharsets(): string[];
    acceptsCharsets(charset: string): string | false;
    acceptsCharsets(charset: string[]): string | false;
    acceptsCharsets(...charset: string[]): string | false;
    acceptsCharsets(charset?: unknown, ...rest?: unknown[]): string | false | string[] {
        throw new Error('Method not implemented.');
    }
    acceptsEncodings(): string[];
    acceptsEncodings(encoding: string): string | false;
    acceptsEncodings(encoding: string[]): string | false;
    acceptsEncodings(...encoding: string[]): string | false;
    acceptsEncodings(encoding?: unknown, ...rest?: unknown[]): string | false | string[] {
        throw new Error('Method not implemented.');
    }
    acceptsLanguages(): string[];
    acceptsLanguages(lang: string): string | false;
    acceptsLanguages(lang: string[]): string | false;
    acceptsLanguages(...lang: string[]): string | false;
    acceptsLanguages(lang?: unknown, ...rest?: unknown[]): string | false | string[] {
        throw new Error('Method not implemented.');
    }
    range(size: number, options?: Options | undefined): Ranges | Result | undefined {
        throw new Error('Method not implemented.');
    }
    accepted: MediaType[];
    param(name: string, defaultValue?: any): string {
        throw new Error('Method not implemented.');
    }
    is(type: string | string[]): string | false | null {
        throw new Error('Method not implemented.');
    }
    protocol: string;
    secure: boolean;
    ip: string;
    ips: string[];
    subdomains: string[];
    path: string;
    hostname: string;
    host: string;
    fresh: boolean;
    stale: boolean;
    xhr: boolean;
    body: any;
    cookies: any;
    method: string;
    params: ParamsDictionary;
    query: ParsedQs;
    route: any;
    signedCookies: any;
    originalUrl: string;
    url: string;
    baseUrl: string;
    app: Application<Record<string, any>>;
    res?: Response<any, Record<string, any>, number> | undefined;
    next?: NextFunction | undefined;
    aborted: boolean;
    httpVersion: string;
    httpVersionMajor: number;
    httpVersionMinor: number;
    complete: boolean;
    connection: Socket;
    socket: Socket;
    headers: IncomingHttpHeaders;
    rawHeaders: string[];
    trailers: NodeJS.Dict<string>;
    rawTrailers: string[];
    setTimeout(msecs: number, callback?: (() => void) | undefined): this {
        throw new Error('Method not implemented.');
    }
    statusCode?: number | undefined;
    statusMessage?: string | undefined;
    destroy(error?: Error | undefined): this {
        throw new Error('Method not implemented.');
    }
    readableAborted: boolean;
    readable: boolean;
    readableDidRead: boolean;
    readableEncoding: BufferEncoding | null;
    readableEnded: boolean;
    readableFlowing: boolean | null;
    readableHighWaterMark: number;
    readableLength: number;
    readableObjectMode: boolean;
    destroyed: boolean;
    closed: boolean;
    errored: Error | null;
    _construct?(callback: (error?: Error | null | undefined) => void): void {
        throw new Error('Method not implemented.');
    }
    _read(size: number): void {
        throw new Error('Method not implemented.');
    }
    read(size?: number | undefined) {
        throw new Error('Method not implemented.');
    }
    setEncoding(encoding: BufferEncoding): this {
        throw new Error('Method not implemented.');
    }
    pause(): this {
        throw new Error('Method not implemented.');
    }
    resume(): this {
        throw new Error('Method not implemented.');
    }
    isPaused(): boolean {
        throw new Error('Method not implemented.');
    }
    unpipe(destination?: NodeJS.WritableStream | undefined): this {
        throw new Error('Method not implemented.');
    }
    unshift(chunk: any, encoding?: BufferEncoding | undefined): void {
        throw new Error('Method not implemented.');
    }
    wrap(stream: NodeJS.ReadableStream): this {
        throw new Error('Method not implemented.');
    }
    push(chunk: any, encoding?: BufferEncoding | undefined): boolean {
        throw new Error('Method not implemented.');
    }
    _destroy(error: Error | null, callback: (error?: Error | null | undefined) => void): void {
        throw new Error('Method not implemented.');
    }
    addListener(event: 'close', listener: () => void): this;
    addListener(event: 'data', listener: (chunk: any) => void): this;
    addListener(event: 'end', listener: () => void): this;
    addListener(event: 'error', listener: (err: Error) => void): this;
    addListener(event: 'pause', listener: () => void): this;
    addListener(event: 'readable', listener: () => void): this;
    addListener(event: 'resume', listener: () => void): this;
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    addListener(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    emit(event: 'close'): boolean;
    emit(event: 'data', chunk: any): boolean;
    emit(event: 'end'): boolean;
    emit(event: 'error', err: Error): boolean;
    emit(event: 'pause'): boolean;
    emit(event: 'readable'): boolean;
    emit(event: 'resume'): boolean;
    emit(event: string | symbol, ...args: any[]): boolean;
    emit(event: unknown, err?: unknown, ...rest?: unknown[]): boolean {
        throw new Error('Method not implemented.');
    }
    on(event: 'close', listener: () => void): this;
    on(event: 'data', listener: (chunk: any) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'pause', listener: () => void): this;
    on(event: 'readable', listener: () => void): this;
    on(event: 'resume', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    once(event: 'close', listener: () => void): this;
    once(event: 'data', listener: (chunk: any) => void): this;
    once(event: 'end', listener: () => void): this;
    once(event: 'error', listener: (err: Error) => void): this;
    once(event: 'pause', listener: () => void): this;
    once(event: 'readable', listener: () => void): this;
    once(event: 'resume', listener: () => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    prependListener(event: 'close', listener: () => void): this;
    prependListener(event: 'data', listener: (chunk: any) => void): this;
    prependListener(event: 'end', listener: () => void): this;
    prependListener(event: 'error', listener: (err: Error) => void): this;
    prependListener(event: 'pause', listener: () => void): this;
    prependListener(event: 'readable', listener: () => void): this;
    prependListener(event: 'resume', listener: () => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    prependOnceListener(event: 'close', listener: () => void): this;
    prependOnceListener(event: 'data', listener: (chunk: any) => void): this;
    prependOnceListener(event: 'end', listener: () => void): this;
    prependOnceListener(event: 'error', listener: (err: Error) => void): this;
    prependOnceListener(event: 'pause', listener: () => void): this;
    prependOnceListener(event: 'readable', listener: () => void): this;
    prependOnceListener(event: 'resume', listener: () => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    removeListener(event: 'close', listener: () => void): this;
    removeListener(event: 'data', listener: (chunk: any) => void): this;
    removeListener(event: 'end', listener: () => void): this;
    removeListener(event: 'error', listener: (err: Error) => void): this;
    removeListener(event: 'pause', listener: () => void): this;
    removeListener(event: 'readable', listener: () => void): this;
    removeListener(event: 'resume', listener: () => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: unknown, listener: unknown): this {
        throw new Error('Method not implemented.');
    }
    [Symbol.asyncIterator](): AsyncIterableIterator<any> {
        throw new Error('Method not implemented.');
    }
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean | undefined; } | undefined): T {
        throw new Error('Method not implemented.');
    }
    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        throw new Error('Method not implemented.');
    }
    removeAllListeners(event?: string | symbol | undefined): this {
        throw new Error('Method not implemented.');
    }
    setMaxListeners(n: number): this {
        throw new Error('Method not implemented.');
    }
    getMaxListeners(): number {
        throw new Error('Method not implemented.');
    }
    listeners(eventName: string | symbol): Function[] {
        throw new Error('Method not implemented.');
    }
    rawListeners(eventName: string | symbol): Function[] {
        throw new Error('Method not implemented.');
    }
    listenerCount(eventName: string | symbol): number {
        throw new Error('Method not implemented.');
    }
    eventNames(): (string | symbol)[] {
        throw new Error('Method not implemented.');
    }
    file?: Express.Multer.File | undefined;
    files?: { [fieldname: string]: Express.Multer.File[]; } | Express.Multer.File[] | undefined;
}