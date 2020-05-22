const on_watch = (id,peerConnections,video,socket) => {
    const { RTCPeerConnection } = window;
    const peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]} );
    peerConnections[id] = peerConnection;
    let stream = video.srcObject;
    if(!stream) return false;

    stream.getTracks().forEach(track => {
        return peerConnection.addTrack(track, stream)
    });

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            socket.emit("offer", id, peerConnection.localDescription);
        }).catch((e) => console.log(e));
    return peerConnections;
};
