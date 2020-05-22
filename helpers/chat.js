const dbHelper = require('./database_helpers');

module.exports.liveGroupChatAndVideoShare = async (socket,io) => {
    try {
        const event_id = socket.handshake.query.event;
        const sender_id = socket.handshake.query.id;
        const allMessages = await dbHelper.getAllMessages(event_id,sender_id);
        const allUsers = await dbHelper.getAllUsers(event_id,sender_id);

        socket.join(event_id);

        socket.emit('all_messages',{
            messages: allMessages
        });

        socket.emit('all_active_users', {
            active_users: allUsers
        });

        const sender = await dbHelper.getActiveUser(sender_id);
        socket.broadcast.to(event_id).emit("new_active_user",{ user:sender });

        socket.on('send_message', async (data) => {

            try {
                const sender = await dbHelper.getActiveUserWithEvent(sender_id,event_id);
                if(!sender && !data.message) return ;

                let createdMessage = await dbHelper.creatMessage(event_id,sender_id,data);

                if(!createdMessage) return;
                createdMessage = createdMessage.toJSON();
                createdMessage['ActiveSocket.first_name'] = sender.first_name;
                createdMessage['ActiveSocket.last_name'] = sender.last_name;
                io.to(event_id).emit('new_message',{
                    message : createdMessage
                });

            } catch (e) {
                console.log(e);
                console.log('error in send message');
            }
        });

        socket.on("disconnect", async (s) => {
            io.to(event_id).emit('user_logout',{
                sender_id : sender_id
            });
        });

        ///////public chat
        socket.on("make_public_chat_admin",async () => {
            await dbHelper.changePublicStatusInEvent(event_id,"public");
            io.to(event_id).emit("make_public_chat",{ private:true });
        });

        //private chat
        socket.on("make_private_chat_admin",async  () => {
            await  dbHelper.changePublicStatusInEvent(event_id,"private");
            io.to(event_id).emit("make_private_chat",{ private:true });
        });

        //end session
        socket.on("end_session",async () => {
            io.to(event_id).emit("end_session_users",{end:true});
            await dbHelper.eventStop(event_id);
            await dbHelper.deleteAllUsersWithMessages(event_id);
        });

        //////////////////////////////////////////
        ///////////////////////video stream

        socket.on("broadcaster", () => {
            socket.broadcast.emit("broadcaster");
        });

        socket.on("watcher", () => {
            io.to(event_id).emit("admin_watcher", socket.id);
        });

        socket.on("disconnect", () => {
            io.to(event_id).emit("admin_disconnectPeer", socket.id);
        });

        socket.on("offer", (id, message) => {
            io.to(id).emit("offer", socket.id, message);
        });

        socket.on("answer", (id, message) => {
            io.to(id).emit("answer", socket.id, message);
        });

        socket.on("candidate", (id, message) => {
            io.to(id).emit("candidate", socket.id, message);
        });

        socket.on('admin_video_stop',() => {
           io.to(event_id).emit('stop_video',{stop:true});
        });
   ////////////////////////////////////
    } catch (e) {
        console.log(e);
        console.log('global error on connection event');
    }
};
