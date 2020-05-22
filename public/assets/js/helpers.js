const deleteAllConnections = (video,socket,peerConnections) =>  {

    video.play();
    socket.emit("admin_video_stop");
    socket.emit("broadcaster");

    for(let id in peerConnections) {
        console.log('close');
        peerConnections[id].close();
    }

    peerConnections = {};
    return peerConnections;
};

const hideLoader = () => {
    $('.admin_video_loader').hide();
    $('#local-video').show();
};

const showLoader = () => {
    $('.admin_video_loader').show();
    $('#local-video').hide();
};

const addActiveUser = (user) => {
      $('#active_users_body').append(`
                    <tr  id="active_user_${user.id}">
               
                        <td><a href="#"><i class="fas fa-user mr-3"></i>${user.first_name + '  '+ user.last_name}</a>
                        </td>
                    </tr>
        `);
};


const attachMessage = (message,my = false) => {

    const date =  new Date(message.created_at);

    const moment_time = moment(date.getTime());

    $('.msg_card_body').append(` <div class="d-flex justify-content-${(my)? 'end': 'start'} mb-4 m-3">          
                 <div class="row">
                         <div class= "col-12">
                                <span class="${(my) ? 'float-right' : ''}"> ${message['ActiveSocket.first_name'] +' '+ message['ActiveSocket.last_name']}</span>
                          </div>
                          <div class=" col-12  ${(!my) ? 'msg_cotainer': 'msg_cotainer_send'}">
                                ${message.content}
                                <span class="${(my) ? 'msg_time_send mr-2' : 'msg_time ml-2'}">${ moment_time.format('hh:mm') } ${ (moment().diff(message.created_at,'days') == 0) ? 'today': moment_time.format('DD/MM/YYYY')}</span>
                          </div>
                 </div> 
          </div>`)
};

const removeSessions = async () => {
    return axios.get('/remove/sessions').then(() => {
        window.location.href = $('#laravel_url').val();
    })
};




const admin_dashboard_functionality = (socket, is_public) => {

    $('#end_session').click(() => {
        socket.emit("end_session",{
            end:true
        })
    });


    $('#settings_dropdown').click((e) => {
        $(e.currentTarget).siblings('.dropdown-menu').toggleClass("show");
    });


    //start time
    const date = new Date($('#start_time_variable').val()).getTime();
    const moment_time = '00:00:00';

    setInterval(() => {
        const diff =  moment.duration(new Date().getTime() - date);
        const horse = diff.hours();
        const minute =  diff.minutes();
        const seconds = diff.seconds();

        $('#start_time').text(((horse.toString().length == 1) ? `0${horse}`: horse) +':'+ ((minute.toString().length == 1) ? `0${minute}`: minute)+':'+((seconds.toString().length == 1) ? `0${seconds}`: seconds));
    },2000);
    $('#start_time').text(moment_time);

    ////////////////////

    if(is_public == "public") {
        $('#chat_private').show();
    } else {
        $('#chat_public').show();
    }

    $('#chat_private').click(() => {
        $('#chat_public').show();
        $('#chat_private').hide();
        socket.emit('make_private_chat_admin', {
            private: true
        });
    });

    $('#chat_public').click(() => {

        $('#chat_public').hide();
        $('#chat_private').show();
        socket.emit('make_public_chat_admin', {
            private: false
        });
    });

};


const user_chat_functionality = (socket, is_public) => {
    if(is_public == "public") {
        $('.type_msg').prop("disabled",false).prop('placeholder','Type your message...');
    } else {
        $('.type_msg').prop('disabled',true).prop('placeholder','Chat only for Admins...');
    }

    socket.on('make_private_chat',() => {
        $('.type_msg').prop('disabled',true).prop('placeholder','Chat only for Admins...');
    });

    socket.on('make_public_chat',() => {
        $('.type_msg').prop("disabled",false).prop('placeholder','Type your message...');
    });
};
