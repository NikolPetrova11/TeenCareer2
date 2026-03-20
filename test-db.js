require('dotenv').config();
const mongoose = require('mongoose');

const dbURI = process.env.MONGODB_URI || "mongodb+srv://new-user31:pbOLxEJKudngaIZY@cluster0.ylxecao.mongodb.net/?retryWrites=true&w=majority&authSource=admin";

console.log("Testing MongoDB connection...");
console.log("URI:", dbURI.replace(/password|pbOLxEJKudngaIZY/g, '****'));

mongoose.connect(dbURI, {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000
})
.then(() => {
  console.log("✓ MongoDB connection successful!");
  mongoose.connection.close();
  process.exit(0);
})
.catch(err => {
  console.error("✗ MongoDB connection failed!");
  console.error("Error:", err.message);
  console.error("\nTroubleshooting steps:");
  console.error("1. Check MongoDB Atlas cluster status (should be green)");
  console.error("2. Add your IP to Network Access whitelist");
  console.error("3. Check your internet connection");
  console.error("4. Temporarily disable Windows Defender Firewall");
  process.exit(1);
});
