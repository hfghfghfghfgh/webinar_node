const on_offer = (id, description,peerConnection,video,socket) => {
    const { RTCPeerConnection } = window;
    peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});
    peerConnection
        .setRemoteDescription(description)
        .then(() => peerConnection.createAnswer())
        .then(sdp => {
            console.log('local description',sdp);
            return peerConnection.setLocalDescription(sdp)
        })
        .then(() => {
            socket.emit("answer", id, peerConnection.localDescription);
        }).catch(e => console.log(e));

    peerConnection.ontrack = event => {

        $('#user_video_loader').hide();
        $('#admin_video').show();

        video.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };
    return peerConnection;

};
