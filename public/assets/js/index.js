$(async  function() {

    if($('#conference').length) {

        if($('#admin').val()) {

            $('#conference').hide();
            $('.navbar').hide();
            $('#first_settings_modal').modal({backdrop: 'static', keyboard: false});
            try {
                await window.navigator.mediaDevices.getUserMedia({
                    video: true,
                });
            } catch (e) {

                console.log(e);
                $('#camera_on_off_modal input').prop('disabled',true);
                $('#camera_on_off_modal label').html("<i style=\"color: red\" class=\"ml-2 fas fa-2x fa-video-slash\"></i>")
            }

            try {
                await window.navigator.mediaDevices.getUserMedia({
                    audio: true,
                });
            } catch (e) {
                console.log(e);
                $('#microphone_on_off_modal input').prop('disabled',true);
                $('#microphone_on_off_modal label').html("<i style=\"color: red\" class=\"ml-2 fas fa-2x fa-microphone-alt-slash\"></i>");
            }



            $('#settings_modal_save').click(async () => {

                $('#first_settings_modal').modal('hide');
                $('#conference').show();
                $('.navbar').show();

                let microphone_modal = $('#microphone_on_off_modal').find("input").prop('checked');
                let camera_modal = $('#camera_on_off_modal').find("input").prop('checked');

                $('#camera_on_off').find("input").prop('checked',camera_modal);
                $('#microphone_on_off').find("input").prop('checked',microphone_modal);

                await startProgram();
            });

        } else {
            await startProgram()
        }
    }


    if($('#not_started').length) {
        let days = moment(not_started_event_date).diff(moment(),'days');
        if(days < 0) {
            $('#title').text("This event already over").css('color','red').show();
            $('#info').hide();
            $('#sub_info').hide();
        } else {
            $('#title').show();
            $('#info').show();
            $('#sub_info').show();
        }
        $('#left_until_days').text((days == 0) ? "Today the opening of the event" : days +" days left until the opening of the event");
    }
});


async function startProgram() {

    window.captureStream = null;
    window.micStream = null;
    window.camera = true;
    window.cameraStream = null;

    const event_id = $('input#event_id').val();
    const active_id = $('input#active_id').val();

    const socket = io(`http://3.17.193.214:8080?event=${event_id}&id=${active_id}`);


    chat_socket_events(socket,active_id);

    chat_buttons_functionality();


    const is_public = $('#is_public').val();

    //end session for all
    socket.on("end_session_users",() => {
        removeSessions();
    });

    if($('#admin').val()) {
        admin_dashboard_functionality(socket,is_public);

    } else {
        //if not admin
        user_chat_functionality(socket,is_public);
    }


    /////////////////////////////video sharing/////////////////////////////
    if(!$('#admin').val()) {
        ///////////////
        const video = document.getElementById('admin_video');
        let peerConnection;

        socket.on("offer", (id, description) => {
            peerConnection = on_offer(id, description,peerConnection,video,socket)
        });

        socket.on("candidate", (id, candidate) => {
            peerConnection
                .addIceCandidate(new RTCIceCandidate(candidate))
                .catch(e => console.error(e));
        });

        socket.on("connect", () => {
            socket.emit("watcher");
        });

        socket.on("broadcaster", () => {

            if(peerConnection) {
                peerConnection.close();
            }
            socket.emit("watcher");
        });




        $(window).bind("beforeunload", function(e) {
            if(peerConnection) {
                peerConnection.close();
            }
            socket.emit('disconnect',{value:true});
        });


        socket.on('stop_video',() => {
            $('#user_video_loader').show();
            $('#admin_video').hide();
        });
    }

    let peerConnections = {};

    if($('#admin').val()) {


        $(window).bind("beforeunload",function(e) {
                for(let id in peerConnections) {
                    peerConnections[id].close();
                }
                socket.emit('end_session');
                removeSessions();
        });

        const video = document.getElementById('local-video');

        socket.on('admin_watcher',(id) => {
            let data = on_watch(id,peerConnections,video,socket);
            if(data) peerConnections = data;
        });

        socket.on("answer", (id, description) => {
            peerConnections[id].setRemoteDescription(description).catch(e => console.log(e));
        });

        socket.on("candidate", (id, candidate) => {
            peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => console.log(e));
        });

        socket.on("admin_disconnectPeer", id => {
            try {
                if(peerConnections[id]) {
                    peerConnections[id].close();
                    delete peerConnections[id];
                }
            } catch (e) {
                console.log('error in close ');
            }
        });




        window.i = 0;
        $('#microphone_on_off').click( async (e) => {
            if(window.i == 1) {
                await microphone_on_off(e,video,socket,peerConnections);
            } else {
                window.i++;
            }
        });


        window.j = 0;
        $('#camera_on_off').click(async (e) => {
            e.stopPropagation();
            if(window.j == 1) {
                await camera_on_of(e,socket,video,peerConnections);
            } else {
                window.j++;
            }
        });


        $('#share_screen').click(async () => {
            peerConnections = await share_screen(socket,video,peerConnections);
        });

        $('#stop_screen_share').click(function(){
            console.log('asdsad');
            stopScreenShare(socket,video)
        });

        peerConnections = await startLocalVideo(peerConnections,video,socket);

    }
}


