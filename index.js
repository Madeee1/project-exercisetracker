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

// 2 and 3 You can POST to /api/users with form data username to create a new user.
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

// 4 & 5 & 6, GET to /api/users that returns an array of users containing only username and _id
app.get("/api/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error in GET /api/users: ", err);
  }
});

// 7 & 8, POST to /api/users/:_id/exercises with form data description, duration, and optionally date.
app.post(
  "/api/users/:_id/exercises",
  express.urlencoded({ extended: true }),
  async (req, res) => {
    const userId = req.params._id;
    const description = req.body.description;
    const duration = req.body.duration;

    // Check if the date is empty, if so, use the current date
    const date = req.body.date ? new Date(req.body.date) : new Date();

    try {
      const newUserAndExercise = await addExerciseToUser(
        userId,
        description,
        duration,
        date
      );
      res.json({
        username: newUserAndExercise.username,
        description: description,
        duration: parseInt(duration),
        date: date.toDateString(),
        _id: userId,
      });
    } catch (err) {
      console.error("Error in POST /api/users/:_id/exercises: ", err);
    }
  }
);

// 9 - 16, GET to /api/users/:_id/logs to retrieve a full exercise log of any user.
// Optional parameters of From, To, and Limit in the query
app.get("/api/users/:_id/logs", async (req, res) => {
  const userId = req.params._id;
  const from = req.query.from; // Date in yyyy-mm-dd format
  const to = req.query.to; // Date in yyyy-mm-dd format
  const limit = req.query.limit;

  // For no further query
  try {
    let [userExLog, countNum] = await getExerciseLog(userId, from, to, limit);
    countNum = userExLog.countExercises();

    res.json({
      username: userExLog.username,
      count: countNum,
      _id: userId,
      // Print out the log array and map the date using toDateString
      log: userExLog.log.map((exercise) => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
        };
      }),
    });
  } catch (err) {
    console.error("Error in GET /api/users/:_id/logs: ", err);
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

// Function to add an exercise to a user
const addExerciseToUser = async (userId, description, duration, date) => {
  // ASSUME THAT THE USER EXISTS
  try {
    // Find by user id and update
    const userAndExercise = await UserExercise.findOneAndUpdate(
      { _id: userId },
      { $push: { log: { description, duration, date } } },
      { new: true }
    );
    return userAndExercise;
  } catch (err) {
    console.error("Error in addExerciseToUser: ", err);
    return Promise.reject(err);
  }
};

// Function to get the exercise log of a user
const getExerciseLog = async (userId, from, to, limit) => {
  try {
    const userExLog = await UserExercise.findById(userId);
    const countNum = userExLog.countExercises();

    // Use if else statements to use the from, to, limit
    if (limit && from && to) {
      // Convert the date to Date object
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Filter the log array
      userExLog.log = userExLog.log.filter((exercise) => {
        return (
          exercise.date.getTime() >= fromDate.getTime() &&
          exercise.date.getTime() <= toDate.getTime()
        );
      });

      // Slice the array
      userExLog.log = userExLog.log.slice(0, limit);
    } else if (limit && !from && !to) {
      userExLog.log = userExLog.log.slice(0, limit);
    } else if (!limit && from && to) {
      // Convert the date to Date object
      const fromDate = new Date(from);
      const toDate = new Date(to);

      // Filter the log array
      userExLog.log = userExLog.log.filter((exercise) => {
        return (
          exercise.date.getTime() >= fromDate.getTime() &&
          exercise.date.getTime() <= toDate.getTime()
        );
      });
    }

    return [userExLog, countNum];
  } catch (err) {
    console.error("Error in getExerciseLog: ", err);
    return Promise.reject(err);
  }
};
