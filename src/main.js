const mediasoup=require('mediasoup-client');
const {v4: uuidV4}=require('uuid');

let btnSub;
let btnCam;
let btnScreen;
let textPublish;
let textWebcam;
let textScreen;
let textSubscribe;
let localVideo;
let remoteVideo;
let remoteStream;
let device;
let producer;
let consumeTransport;
let userId;
let isWebcam;
let produceCallback,produceErrback;
let consumerCallback,ConsumerErrback;
const websocketURL='ws://localhost:8000/ws';


let socket;

document.addEventListener("DOMContentLoaded",function(){
    btnCam=document.getElementById('btn_webcam');
    btnScreen=document.getElementById('btn_screen');
    btnSub=document.getElementById('btn_subscribe');
    textWebcam=document.getElementById('webcam_status');
    textScreen=document.getElementById('screen_status');
    textSubscribe=document.getElementById('subscribe_status');
    localVideo=document.getElementById('localVideo');
    remoteVideo=document.getElementById('remoteVideo');

});