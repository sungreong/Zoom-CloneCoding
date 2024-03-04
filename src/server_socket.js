import http from 'http';
import express, { application } from 'express';  
// import Websoket from 'ws'; // 웹소켓을 사용하기 위해 웹소켓 모듈을 가져옵니다.
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

function publicRooms() { 
    const {sockets: {adapter: {sids, rooms}}} = wsServer;

    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}


wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        console.log(wsServer.sockets.adapter.rooms);
        console.log(`Socket Event: ${event}`);
        
    }
    );
    socket.on("enter_room" , (roomName, done) => {
        
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        // socket.to(roomName).emit("welcome", socket.nickname); 
        wsServer.sockets.emit("room_change", publicRooms());

    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("bye",socket.nickname,countRoom(room) - 1));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    }
    );

    socket.on("new_message", (msg, room, done) => {
        console.log(msg, room, done);
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    }
    );

    socket.on("nickname", (nickname) => {
        socket['nickname'] = nickname;
    });
}
); // 웹소켓 서버에 연결되면 콘솔에 출력합니다.






// const wss = new Websoket.Server({ server }); // 웹소켓 서버를 실행합니다.
// 웹소켓 서버는 웹 서버와 같은 포트에서 실행됩니다.
// http 서버와 웹소켓 서버를 동시에 실행하기 위해 http 서버를 생성하고 웹소켓 서버를 생성할 때 http 서버를 전달합니다.
// protocol: ws://localhost:3000/ 이런식으로 접속할 수 있음
// function onSocketClose() {
//     console.log("Disconnected from the Browser");
// } // 브라우저와의 연결이 끊기면 콘솔에 출력합니다.
// const sockets = [];
// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anon";
//     console.log("Connected to Browser");
//     // socket methods
//     socket.on("close", onSocketClose);
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch (message.type){
//             case "new_message":
//                 sockets.forEach((aSocket) => aSocket.send(`${socket.nickname}: ${message.payload}`));
//                 break
//             case "nickname":
//                 socket["nickname"] = message.payload;
//                 break
//         }
//     });
// }
// );