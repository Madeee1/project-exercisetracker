const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

// 1 and 2 You can POST to /api/users with form data username to create a new user.
app.post(
  "/api/users",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const username = req.body.username;

    //Call the mongoose function to get username from the database
    try {
      const user = await getIdFromUser(username);
      res.json({ username: username, _id: user._id });
    } catch (err) {
      console.error("Error in POST /api/users: ", err);
    }
  }
);

// 3 & 4, GET to /api/users that returns an array of users containing only username and _id
app.get("/api/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error in GET /api/users: ", err);
  }
});

// The use of MongoDB and mongoose below here
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "ExerciseTracker",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected!"))
  .catch((err) => {
    console.log("DB Connection Error: ${err.message}");
  });

// Schema
const userExerciseSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  // Array
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, required: true },
    },
  ],
});

// Schema method to count the number of exercises
userExerciseSchema.methods.countExercises = function () {
  return this.log.length;
};

// Model
const UserExercise = mongoose.model(
  "UserAndExercise",
  userExerciseSchema,
  "UserDatabase"
);

//Function to get the id by username parameter
const getIdFromUser = async (username) => {
  // Try to find the id, if not found, create a new user
  try {
    const user = await UserExercise.findOne({ username: username });
    return user._id;
  } catch (err) {
    const newUser = new UserExercise({ username: username });

    try {
      await newUser.save();
      return newUser._id;
    } catch (err) {
      console.error("Error in getIdFromUser: ", err);
      return Promise.reject(err);
    }
  }
};

// Function to return an array of all users, only username and _id
const getAllUsers = async () => {
  try {
    const users = await UserExercise.find({}, { username: 1, _id: 1 });
    return users;
  } catch (err) {
    console.error("Error in getAllUsers: ", err);
    return Promise.reject(err);
  }
};
