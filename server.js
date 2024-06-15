// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let scores = {};
let firstResponder = null;
let quizmasterSocket = null;

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("registerQuizmaster", () => {
    quizmasterSocket = socket;
    socket.emit("assignRole", "quizmaster");
  });

  socket.on("assignRole", (assignedRole) => {
    quizmasterSocket = socket;
    socket.emit("assignRole", assignedRole);
  });

  socket.on("raiseHand", (data) => {
    if (!firstResponder) {
      firstResponder = data.name;
      io.emit("firstResponder", firstResponder);
    }
  });

  socket.on("correctAnswer", () => {
    if (socket === quizmasterSocket && firstResponder) {
      if (!scores[firstResponder]) scores[firstResponder] = 0;
      scores[firstResponder] += 1;
      firstResponder = null;
      io.emit("updateScoreboard", scores);
      io.emit("reset");
    }
  });

  socket.on("reset", () => {
    if (socket === quizmasterSocket) {
      firstResponder = null;
      scores = {};
      io.emit("reset");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    if (socket === quizmasterSocket) {
      quizmasterSocket = null;
    }
  });
});

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(4000, () => console.log("Server listening on port 4000"));
