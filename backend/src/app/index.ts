import express from "express";
import Middleware from "./routes/middleware.js";
import Routes from "./routes/index.js";

const app = express();

Middleware(app);
Routes(app);

export default app;