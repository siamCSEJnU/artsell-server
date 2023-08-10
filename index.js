const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || "5000";

//middleware
app.use(cors());
app.use(express.json());

// artsellUser
// e29UoWdM0CaMLvGI

const uri =
  "mongodb+srv://artsellUser:e29UoWdM0CaMLvGI@cluster0.2jfyhqy.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db("artsellDB").collection("users");
    const allArtWorksCollection = client
      .db("artsellDB")
      .collection("allArtWorks");

    //users api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist" });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    //artworks api

    app.post("/allArtWorks", async (req, res) => {
      const newArt = req.body;
      const result = await allArtWorksCollection.insertOne(newArt);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("artsell is running");
});

app.listen(port, () => {
  console.log(`artsell is running on port ${port}`);
});
