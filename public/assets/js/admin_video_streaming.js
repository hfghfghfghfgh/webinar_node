const stopScreenShare = (socket,video) => {
    try {
        window.captureStream = null;
        window.micStream = null;
        $('#camera_on_off').show();
        $('#share_screen').show();
        $('#stop_screen_share').hide();
        socket.emit("admin_video_stop");

        let tracks = video.srcObject.getTracks();

        tracks.forEach(track => track.stop());
        video.srcObject = null;
        startLocalVideo();
    } catch (e) {
        console.log('no video');
    }

};


const stopLocalVideo = (socket,video) => {
    try {
        window.cameraStream = null;
        socket.emit("admin_video_stop");
        let tracks = video.srcObject.getTracks();

        tracks.forEach(track => track.stop());
        video.srcObject = null;
    } catch (e) {
        console.log('no video');
    }

};


const startLocalVideo = async (peerConnections,video,socket) => {
    try{
        window.camera = true;
        const cam = $('#camera_on_off').find("input").prop('checked');
        const mic = $('#microphone_on_off').find("input").prop('checked');
        const config = {};

        if(cam) {
            config.video = true;
        }

        if(mic) {
            if(!cam) {
                showLoader();
            }

            config.audio = {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        }

        if(!cam && !mic) {
            showLoader();
            return false
        }

        await window.navigator.mediaDevices.getUserMedia(config);

        peerConnections = deleteAllConnections(video,socket,peerConnections);

        if(cam) hideLoader()
        return peerConnections;
    } catch (e) {
        $('#camera_on_off').hide();
        showLoader()
    }

};

const share_screen = async (socket,video,peerConnections) => {

    try {
        window.camera = false;

        $('#camera_on_off').hide();
        $('#share_screen').hide();
        $('#stop_screen_share').show();

        stopLocalVideo(socket, video);


        const mic = $('#microphone_on_off').find("input").prop('checked');

        window.captureStream =
            await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
                width: 1280,
                height: 720
            }
        });

        let composedStream;
        if(mic) {
            window.micStream =  await navigator.mediaDevices.getUserMedia({audio: true});

            composedStream = new MediaStream();

            window.captureStream.getVideoTracks().forEach(function(videoTrack) {
                composedStream.addTrack(videoTrack);
            });

            window.micStream.getAudioTracks().forEach(function(micTrack) {
                composedStream.addTrack(micTrack);
            });
        } else {
            composedStream = window.captureStream;
        }



        video.srcObject =composedStream;
        peerConnections = deleteAllConnections(video,socket,peerConnections);

        window.captureStream.getVideoTracks()[0].onended = function () {
            stopScreenShare(socket,video);
            peerConnections = startLocalVideo(peerConnections,video,socket);
        };

        hideLoader();
        return peerConnections;
    } catch (e) {
        console.log(e);
        showLoader();
    }
};


const camera_on_of = async (e,socket,video,peerConnections) => {
    try{
        $('#camera_on_off').find("input").prop('disabled',true);
        setTimeout(() => {
            $('#camera_on_off').find("input").prop('disabled',false);
        },3000);

        window.j = 0;
        let off = false;
        const prop = $(e.currentTarget).find("input").prop('checked');
        const mic_prop = $('#microphone_on_off').find("input").prop('checked');
        if(window.camera) {
            if(prop) {
                console.log('->on ');
                stopLocalVideo(socket,video);
                if(mic_prop) {
                    window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                } else{
                    window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                        video: true,
                    });
                }

                video.srcObject = window.cameraStream;
                hideLoader();
            } else{
                console.log('->of+- ');
                stopLocalVideo(socket,video);
                if(mic_prop) {
                    showLoader();

                    window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                        audio: true
                    });

                } else{
                    showLoader();
                    off = true;
                }

                if(!off) video.srcObject = window.cameraStream;
            }
        }

        if(off) return false;

        peerConnections = deleteAllConnections(video,socket,peerConnections);
        return peerConnections;
    } catch (e) {
        console.log(e);
    }
};

const microphone_on_off = async (e,video,socket,peerConnections) => {
    try {

        $('#microphone_on_off').find("input").prop('disabled',true);
        setTimeout(() => {
            $('#microphone_on_off').find("input").prop('disabled',false);
        },3000);

        window.i = 0;
        let off = false;
        const prop = $(e.currentTarget).find("input").prop('checked');

        if(prop && !window.camera) {
            let composedStream = new MediaStream();

            window.captureStream.getVideoTracks().forEach(function(videoTrack) {
                composedStream.addTrack(videoTrack);
            });

            window.micStream.getAudioTracks().forEach(function(micTrack) {
                composedStream.addTrack(micTrack);
            });

            video.srcObject = composedStream;
        } else if(!window.camera) {
            video.srcObject = window.captureStream;
        }

        if(window.camera) {
            const track = (window.cameraStream) ? window.cameraStream.getVideoTracks()[0] : false;
            if(track && !prop) {
                stopLocalVideo(socket,video);
                window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                video.srcObject = window.cameraStream;
            } else if(track && prop){
                stopLocalVideo(socket,video);
                window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                video.srcObject = window.cameraStream;
            } else if(!track && !prop) {
                stopLocalVideo(socket,video);
                off = true;
                showLoader();
            } else if(!track && prop){
                stopLocalVideo(socket,video);
                showLoader();
                window.cameraStream = await window.navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                video.srcObject = window.cameraStream;
            }
        }

        if(off) return false;

        peerConnections = deleteAllConnections(video,socket,peerConnections);
        return peerConnections;
    } catch (e) {
        console.log('eeee', e)
    }
}
