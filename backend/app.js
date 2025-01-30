// app.js
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import routes from "./routes.js";

const app = express();
app.use(cors());
app.use(routes);

app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.listen(config.PORT, config.HOST, () => {
  console.log(`Server running at http://${config.HOST}:${config.PORT}`);
});
