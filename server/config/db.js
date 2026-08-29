// const mongoose = require("mongoose");

// const connectDB = async () => {
//   try {
//     const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/derma_ai";
//     const conn = await mongoose.connect(uri);
//     console.log(`[DermaAI] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
//   } catch (err) {
//     console.error(`[DermaAI] MongoDB connection error: ${err.message}`);
//     // Fail loudly rather than silently running with no DB connection.
//     process.exit(1);
//   }
// };

// module.exports = connectDB;



const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // MongoDB Atlas connection string from .env
    const uri = process.env.MONGODB_URI;

    // Stop immediately if the environment variable is missing
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not defined. Please add it to your .env file."
      );
    }

    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(uri);

    console.log(
      `[DermaAI] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (err) {
    console.error(
      `[DermaAI] MongoDB connection error: ${err.message}`
    );

    process.exit(1);
  }
};

module.exports = connectDB;