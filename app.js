import express from "express";

const app = express();

app.use(express.json());

app.get("/api/v1/tweet", (req, res) => {
  res.status(200).json({ message: "Hello world!" });
});

app.post("/api/v1/tweet", (req, res) => {
  console.log(req.body);
  res.send("Done");
});

const port = 5000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
