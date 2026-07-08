import { Application, json, urlencoded } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";

export default (app: Application) => {
if (process.env.NODE_ENV === "production") {
    app.use(compression());
    app.use(helmet());
}

app.use(json({ limit: "100kb", type: "*/json" }));

app.use(
    urlencoded({
        extended: true,
        limit: "100kb",
        type: "*/x-www-form-urlencoded",
    })
);

app.use(cors());

if (process.env.NODE_ENV !== "production") {
    app.use((req, res, next) => {
    console.log("=========================================");
    console.log({
        token: req.headers.authorization,
        method: req.method,
        url: `${req.get("HOST")}${req.originalUrl}`,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    console.log("=========================================");
    next();
    });
  }
};