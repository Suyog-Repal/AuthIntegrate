import dotenv from "dotenv";

dotenv.config();

export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || "supersecret",
  jwtExpiresIn: "2h",
  saltRounds: 10,
};
