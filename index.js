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

// 1. You can POST to /api/users with form data username to create a new user.

// 2. The returned response from POST /api/users with form data username will be an object with username and _id properties.

// The use of MongoDB and mongoose below here
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected!"))
  .catch((err) => {
    console.log("DB Connection Error: ${err.message}");
  });

// Schema
const userExerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
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
  const user = await UserExercise.findOne({ username: username });
  return user._id;
};
