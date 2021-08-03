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

    btnCam.addEventListener('click',publish);
    btnScreen.addEventListener('click',publish);
    //btnSub.addEventListener('click', subscribe);

});

const connect = () => {
    socket = new WebSocket(websocketURL);
    socket.onopen = () => {
        const msg = {
            type:"getRouterRtpCapabilities"
        }
        const res = JSON.stringify(msg);
        socket.send(res);
    }
    socket.onmessage = (event) => {
        const isValidJSON = IsJsonString(event.data);
        if (!isValidJSON) {
          console.error("json error:", event);
          return
        }
        const resp = JSON.parse(event.data);
        switch (resp.type) {
          case "routerCapabilities":
            onRouterCapabilities(resp)
            break;
            case "producerTransportCreated":
                onProducerTransportCreated(resp);
                break;
            case "producerConnected":
                socket.dispatchEvent(event);
          default:
            break;
        }
    }



    const onProducerTransportCreated = async (event) => {
        if (event.error) {
            console.error("", event.error);
            return;
        }

        const transport = device.createSendTransport(event.data);
        transport.on('connect', async ({ dtlsParameters }, callback, errback) => {
            const message = {
                type: 'connectProducerTransport',
                dtlsParameters
            }
            const resp = JSON.stringify(message);
            socket.send(resp);
            socket.addEventListener('producerConnected', (event) => {
                callback();
            });

        });
        //begin transport producer
        transport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
            const message = {
                type: 'produce',
                transportId: transport.id,
                kind,
                rtpParameters
            }
            const resp = JSON.stringify(message);
            socket.send(resp);

            socket.addEventListener('published', (resp) => {
                callback(resp.data.id);
            });

        });

        //connection state
        transport.on('connectStatechange', (state) => {
            switch (state) {
                case 'connecting':
                    textPublish.innerHTML = 'publishing...'
                    break;
                
                case 'connected':
                    localVideo.srcObject = stream;
                    textPublish.innerHTML = 'published';
                    break;
                case 'failed':
                    transport.close();
                    textPublish.innerHTML = 'failed';
                    break;
                default:
                    break;
            }
        });
        let stream;
        try {
            stream = await getUserMedia(transport, isWebcam);
            const track = stream.getVideoTracks()[0];
            const params = { track };
            producer = await transport.produce(params);
        } catch (error) {
            console.error(error);
            textPublish.innerHTML = 'failed';
        }
        
    }

    const onRouterCapabilities = (resp) => {
        loadDevice(resp.data);
        btnCam.disabled = false;
        btnScreen.disabled = false;
    }
    

    

    const IsJsonString = (str) => {
        try {
          JSON.parse(str);
        } catch (error) {
          return false;
        }
        return true;
    }
    
    const loadDevice = async (routerRtpCapabilities) => {
        try {
            device = new mediasoup.Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.log("not supported browser");
           } 
        }
        await device.load({ routerRtpCapabilities });
    }
    const getUserMedia = async (transport, isWebcam)=>{
        if (!device.canProduce('video')) {
            console.error("can't produce video!");
            return;
        }
        let stream;
        try {
            stream = isWebcam ?
                await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) :
                await navigator.mediaDevices.getDisplayMedia({ video: true });
        } catch (error) {
            console.error(error);
            throw error;
        }
        return stream;
    }

}
const publish = (e) => {
    isWebcam = (e.target.id === 'btn_webcam');
    textPublish = isWebcam ? textWebcam : textScreen;
    btnScreen.disabled = true;
    btnCam.disabled = true;

    const message = {
        type: 'createProducerTransport',
        forceTcp: false,
        rtpCapabilities:device.rtpCapabilities
    }

    const resp = JSON.stringify(message);
    socket.send(resp);
}

connect();