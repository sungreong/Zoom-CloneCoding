const socket = io();
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const room = document.getElementById("room");
room.hidden = true;
let roomName;

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    console.log(input.value,"here??");
    socket.emit("new_message", input.value, roomName, () => {
        console.log("message sent", input.value);
        addMessage(`You: ${input.value}`);
        input.value = "";
    });
    
}
function handleNickNameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room: ${roomName}`;

    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");   

    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNickNameSubmit);
}

function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    socket.emit(
        "enter_room", 
        input.value,
        showRoom
        // 보완 필요하기 때문에 뒤에 done을 추가함
        // frontend에서 backend로 데이터를 보내고 backend에서 처리가 끝나면 frontend에게 알려주는 방법
        );
    input.value = "";
}

function addMessage(message) {
    const ul = room.querySelector("#ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.append(li);
}

socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;

    addMessage(`${user} arrived!`);
});

socket.on("bye", (left , newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ`);
}); // 누군가가 방을 나가면 콘솔에 출력합니다.

socket.on("new_message", addMessage); // 새로운 메시지를 받으면 콘솔에 출력합니다.
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0) {
        return;
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
}); // 방이 생성되거나 삭제되면 콘솔에 출력합니다.
















// 02 버전 이전

// const messageList = document.getElementById("ul");
// const messageForm = document.getElementById("message");
// const nickForm = document.getElementById("nickname");
// const socket = new WebSocket(`ws://${window.location.host}`);

// function handleOpen() {
//     console.log("Connected to Server");
// } // 서버에 연결되면 콘솔에 출력합니다.
// socket.addEventListener("open", handleOpen); // 서버에 연결되면 콘솔에 출력합니다.

// socket.addEventListener("message", (message) => {
//     const li = document.createElement("li");
//     li.innerText = message.data;
//     messageList.append(li);
// }
// ); // 서버로부터 메시지를 받으면 콘솔에 출력합니다.

// socket.addEventListener("close", () => {
//     console.log("Disconnected from Server");
// }   // 서버와의 연결이 끊기면 콘솔에 출력합니다.
// );

// function makeMessage(type, payload) {
//     const msg = { type, payload };
//     return JSON.stringify(msg);
// } // 메시지 타입과 페이로드를 입력받아 JSON 형식으로 변환합니다.    


// function handleSubmit(event) {
//     event.preventDefault();
//     const message = messageForm.querySelector("input");
//     socket.send(makeMessage("new_message", message.value));
//     const li = document.createElement("li");
//     li.innerText = `You: ${message.value}`;
//     messageList.append(li);

//     message.value = "";
// } // 메시지를 입력하고 전송하면 서버로 메시지를 보냅니다.

// messageForm.addEventListener("submit", handleSubmit); // 메시지를 입력하고 전송하면 서버로 메시지를 보냅니다.

// function handleNickSubmit(event) {
//     event.preventDefault();
//     const input = nickForm.querySelector("input");
//     // payload format
//     socket.send(makeMessage("nickname", input.value));
//     input.value = "";
// } // 닉네임을 입력하고 전송하면 서버로 닉네임을 보냅니다.

// nickForm.addEventListener("submit", handleNickSubmit); // 닉네임을 입력하고 전송하면 서버로 닉네임을 보냅니다.

// // socket.addEventListener("message", (message) => {
// //     appendMessage(message.data);
// // }
// // ); // 서버로부터 받은 메시지를 화면에 출력합니다.

