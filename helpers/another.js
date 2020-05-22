const {createActiveSocket,changeParentOfMessages,deleteActiveUser} = require('./database_helpers');

module.exports.setOldValues = (req,first_name,last_name) => {
        req.session.oldValues = {
            first_name: first_name,
            last_name: last_name
        };
};

module.exports.abort404 = (res) => {
    return res.redirect('/404');
};

module.exports.createActiveUserFromSession = async (req,event_id) => {

    if(req.session.activeUser) {
       let user = req.session.activeUser;
       let old_id = user;
       await deleteActiveUser(old_id.id);
       user = await createActiveSocket({first_name : user.first_name,last_name: user.last_name,event_id: event_id});
       const new_user = user.dataValues;
       await changeParentOfMessages(new_user.id,old_id.id);

       return new_user;
    }
    return false;
};
