const express = require("express");

const app = express();
const port = process.env.PORT || "5000";

app.get("/", (req, res) => {
  res.send("artsell is running");
});

app.listen(port, () => {
  console.log(`artsell is running on port ${port}`);
});
