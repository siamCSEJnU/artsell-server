const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || "5000";

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2jfyhqy.mongodb.net/?retryWrites=true&w=majority`;

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

    app.get("/allUsers", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

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

    app.get("/allArtWorks", async (req, res) => {
      const result = await allArtWorksCollection.find().toArray();
      res.send(result);
    });

    app.post("/allArtWorks", async (req, res) => {
      const newArt = req.body;
      const result = await allArtWorksCollection.insertOne(newArt);
      res.send(result);
    });

    //bidding api
    app.post("/updateBiddingInfo/:artId", async (req, res) => {
      const artId = req.params.artId;
      const newBiddingInfo = req.body;

      const filter = { _id: new ObjectId(artId) };
      const document = await allArtWorksCollection.findOne(filter);

      if (!document.bidding_info) {
        // Field hasn't been renamed, rename it first
        const renameUpdate = {
          $rename: { bidding_prices: "bidding_info" },
        };

        await allArtWorksCollection.updateOne(filter, renameUpdate);
      }

      // Now perform the push operation to append newBiddingInfo
      const setUpdate = {
        $push: { bidding_info: newBiddingInfo },
      };

      const setResult = await allArtWorksCollection.updateOne(
        filter,
        setUpdate,
        { returnDocument: "after" }
      );

      res.send(setResult);
    });

    //verification of client/admin/artists

    app.get("/users/client/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { client: user?.role === "client" };
      res.send(result);
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });
    app.get("/users/artist/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = {
        artist: user?.role !== "admin" && user?.role !== "client",
      };
      res.send(result);
    });

    //user role updation
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //update artworks
    app.patch("/allArtWorks/update/:artId", async (req, res) => {
      const id = req.params.artId;
      const filter = { _id: new ObjectId(id) };
      const {
        art_name,
        base_price,
        owner_name,
        owner_email,
        owner_location,
        art_size,
        bidding_status,
        description,
        validity,
      } = req.body;

      // Build the update operation using the $set operator
      const updatedArtWork = {
        $set: {
          art_name,
          base_price: parseFloat(base_price),
          owner_name,
          owner_email,
          owner_location,
          art_size,
          bidding_status,
          description,
          validity,
        },
      };
      const result = await allArtWorksCollection.updateOne(
        filter,
        updatedArtWork
      );
      res.send(result);
    });

    //accept artwork
    app.patch("/allArtWorks/accept/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "accepted",
        },
      };
      const result = await allArtWorksCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    //reject artwork

    app.patch("/allArtWorks/reject/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "denied",
        },
      };
      const result = await allArtWorksCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.patch("/followers/follow/:artistId/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;
      const artistId = req.params.artistId;
      const filter = { _id: new ObjectId(artistId) };
      const updateDoc = {
        $addToSet: { followers: userEmail },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    app.patch("/followers/unfollow/:artistId/:userEmail", async (req, res) => {
      const userEmail = req.params.userEmail;
      const artistId = req.params.artistId;
      const filter = { _id: new ObjectId(artistId) };
      const updateDoc = {
        $pull: { followers: userEmail },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //deleteArtWork
    app.delete("/allArtWorks/delete/:artId", async (req, res) => {
      const id = req.params.artId;
      const filter = { _id: new ObjectId(id) };
      const result = await allArtWorksCollection.deleteOne(filter);
      res.send(result);
    });

    //deleteUser
    app.delete("/allUsers/delete/:userId", async (req, res) => {
      const id = req.params.userId;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
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
