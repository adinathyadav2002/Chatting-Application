import mysql from "mysql2";

// create a connection
export const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Adinathsy@123",
  database: "chat_app",
});
