import express from "express";
import morgan from "morgan";


import userRouter from './routes/user.route.js'
import connMongo from "./db/connMongo.js";
const app = express();
app.use(express.json());
app.use(morgan("dev"));


app.get("/healthz", (req, res) => res.json({ ok: true, service: "user api" }));

app.use('/user',userRouter )


const PORT = process.env.PORT || 3002

connMongo()

app.listen(PORT, () => console.log(`Gateway listening on ${PORT}`));
