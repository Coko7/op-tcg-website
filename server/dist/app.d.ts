import express from 'express';
declare const app: import("express-serve-static-core").Express;
export declare const initializeApp: () => Promise<express.Application>;
export declare const closeApp: () => Promise<void>;
export default app;
