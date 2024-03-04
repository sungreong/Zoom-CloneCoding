const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
const chatContainer = document.getElementById("chatContainer");
// call form

call.hidden = true;
chatContainer.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();        
        const cameras = devices.filter((device) => device.kind === "videoinput");
        
        const currentCamera = myStream.getVideoTracks()[0];
        camerasSelect.innerHTML = "";
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });

    } catch (e) {
        console.log(e);
    }


}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        console.log(myStream);
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
        else {
            muteBtn.innerText = "Mute";
            cameraBtn.innerText = "Turn Camera Off";
        }
    }
    catch (e) {
        console.log(e);
    }
}

function handleMuteClick() {   
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        const isMuted = muteBtn.classList.toggle("on");
        muteBtn.classList.toggle("off", !isMuted);
        muteBtn.innerText = "Unmute";
        muted = true;
    }
    else {
        const isMuted = muteBtn.classList.toggle("off");    
        muteBtn.classList.toggle("on", !isMuted);
        muteBtn.innerText = "Mute";
        muted = false;
    }

};
function handleCameraClick() {   
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));

    if (cameraOff) {
        const isOff = cameraBtn.classList.toggle("off");
        cameraBtn.classList.toggle("on", !isOff);
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        const isOff = cameraBtn.classList.toggle("on");
        cameraBtn.classList.toggle("off", !isOff);
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
} ;




muteBtn.addEventListener("click", handleMuteClick);

cameraBtn.addEventListener("click", handleCameraClick);
async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    // 
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");  
        console.log(videoSender);        
        videoSender.replaceTrack(videoTrack); 
    }


}
camerasSelect.addEventListener("input",handleCameraChange);

// Path: zoom-clone/src/public/js/app.js

// welcomeForm (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
async function initCall() {
    console.log("initCall");
    welcome.hidden = true;
    call.hidden = false;    
    chatContainer.hidden = false;
    call.style.display = "flex";
    chatContainer.style.display = "flex";
    await getMedia();
    makeConnection();
}


async function handleWelcomeSubmit(event) {   
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

function setupDataChannel(dataChannel) {
    console.log("Data channel is set up.");
    myDataChannel = dataChannel;
    myDataChannel.addEventListener("message", handleDataChannel);
    // 폼 제출 이벤트 리스너 추가
    const chatForm = document.querySelector('#chatForm');
    chatForm.addEventListener("submit", function(event) {
        event.preventDefault(); // 폼의 기본 제출 동작 방지
        const input = chatForm.querySelector('input[type="text"]');
        const message = input.value; // 입력 필드에서 메시지 텍스트 가져오기

        if (message && myDataChannel) {
            myDataChannel.send(message); // 데이터 채널을 통해 메시지 보내기
            displayMessage(message, 'me'); // 메시지 목록에 본인이 보낸 메시지 추가
            input.value = ''; // 입력 필드 초기화
        }
    });
}

function displayMessage(message, sender) {
    const messageContainer = document.querySelector('#messages');
    const messageElement = document.createElement('li');
    messageElement.textContent = `${sender}: ${message}`;
    messageElement.className = sender === 'me' ? 'my-message' : 'their-message';
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight; // 스크롤을 최신 메시지 위치로 이동
}



function handleDataChannel (event) {
    console.log("got some data over the data channel");
    console.log(event.data);
    displayMessage(event.data, 'them');
}
// socket code
socket.on("welcome", async () => {
    myDataChannel = myPeerConnection.createDataChannel("chat");
    setupDataChannel(myDataChannel);

    const offer = await myPeerConnection.createOffer();
    console.log(offer);
    // 뜻 : offer를 만들고, offer를 내 로컬 디스크립션으로 설정한다.
    // 그리고 offer를 방 이름으로 보낸다.
    // offer를 보내는 이유는, offer를 받은 사람이 answer를 만들어서 보내기 위해서이다.
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});
// offer를 주고 받기 위해서는 offer를 만들고, offer를 내 로컬 디스크립션으로 설정하고, offer를 보내면 된다.
// 그리고 offer를 받은 사람은 offer를 받아서 answer를 만들고, answer를 보내면 된다.

socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        console.log("data channel event");
        console.log(event);
        myDataChannel = event.channel;
        setupDataChannel(event.channel);
    });
    await myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);

    socket.emit("answer", answer, roomName);
});

socket.on("answer",  (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code 
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers : [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ]
    });
    myPeerConnection.addEventListener('datachannel', event => {
        const dataChannel = event.channel;
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    // myPeerConnection.addEventListener("track", handleTrack)

    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleAddStream(data) {
    console.log("got an event from my peer");
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;

    // const peerFace = document.getElementById("peerFace");
    // peerFace.srcObject = data.stream;
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

