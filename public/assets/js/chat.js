const chat_socket_events = (socket,active_id) => {
    socket.on('user_logout',(data) => {
        $('#active_user_'+data.sender_id).remove();
    });

    socket.on("new_active_user",(data) => {
        addActiveUser(data)
    });

    socket.on("all_active_users",(data) => {
        data.active_users.forEach(user => {
            addActiveUser(user)
        })
    });

    socket.on('all_messages',(data) => {

        data.messages.forEach(message => {
            if(message['ActiveSocket.id'] == active_id) {
                attachMessage(message,true)
            } else {
                attachMessage(message)
            }
        });

        setTimeout(() => {
            $('.msg_card_body').animate({
                scrollTop: $('.msg_card_body').prop("scrollHeight")
            });
        },2000);

    });

    socket.on('new_message',(data) => {
        if(active_id == data.message.active_sockets_id) {
            attachMessage(data.message,true);
        } else {
            attachMessage(data.message)
        }

        $('.msg_card_body').animate({
            scrollTop: $('.msg_card_body').prop("scrollHeight")
        }, 'slow');
    });


    $('.send_btn').click(() => {

        const text = $('.type_msg').val();

        if(!text) {
            $('#send').css("color", "red");
            setTimeout(() => $('#send').css("color", "black"),2000);
            return;
        }

        $('.type_msg').val('');

        socket.emit('send_message',{
            message: text,
        })

    });
};


const chat_buttons_functionality = () => {
    $('.show_active_users').click(() => {
        $('#active_users_list').toggle()
    });

    $('.action_menu_btn').click(function () {
        $('.action_menu').toggle();
    });


    $('#close_chat').click(() => {
        $('.action_menu').hide();
        $('#chat').hide();
        $('#video').removeClass('col-8').addClass('col-11');
        $('#hidden_chat_button').show();
    });

    $('#close_chat_hidden').click(() => {
        $('.action_menu').hide();
        $('#chat').show();
        $('#video').removeClass('col-11').addClass('col-8');
        $('#hidden_chat_button').hide();
    });
};
