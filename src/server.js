import http from 'http';
import express, { application } from 'express';  
import {Server} from 'socket.io'; // 웹소켓을 사용하기 위해 웹소켓 모듈을 가져옵니다.
import { instrument } from '@socket.io/admin-ui'
const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.get("/", (req, res) => res.render("home")); // 홈페이지를 렌더링합니다.
app.use("/public", express.static(__dirname + "/public")); // public 폴더를 static 폴더로 사용합니다.
app.get("/*", (req, res) => res.redirect("/")); // 모든 요청을 홈페이지로 리다이렉트합니다. 
const handleListening = () => console.log(`Server listening on port 3000`); // 서버가 3000번 포트에서 실행되면 콘솔에 출력합니다.
// app.listen(3000, handleListening) // 서버를 3000번 포트로 실행합니다.

const httpServer = http.createServer(app)
httpServer.listen(3000, handleListening); // 서버가 3000번 포트에서 실행되면 콘솔에 출력합니다.


const wsServer = new Server(httpServer, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
  });

instrument(wsServer, {
    auth: false,
    mode: "development",
  });

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        // done();
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    }); 
});