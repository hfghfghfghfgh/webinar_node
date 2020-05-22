const axios = require('axios');
const config = require('config');
const another = require('./another');
const dbHelper = require('./database_helpers');

module.exports.checkPasswordAndCreateActiveUser = (req,res,first_name,last_name,event_id,start_config) => {
    const password = req.body.password;
    if(!password.length) {

        another.setOldValues(req,first_name,last_name);
        return res.redirect('/join/event/'+event_id+'?wrong_password=true');
    }
    axios.get(`${config[start_config].app.laravel_url}/api/check/event/${event_id}/password/${password}`)
        .then(async response => {
            const active_user = await dbHelper.createActiveSocket({first_name: first_name,last_name: last_name, event_id: event_id});

            req.session.activeUser = active_user.dataValues;

            res.redirect(`/join/event/${event_id}/active/${active_user.id}`);
            return res.end();
        })
        .catch(error=> {
            console.log(error);
            if(error.response && error.response.status == 401) {
                another.setOldValues(req,first_name,last_name);
                res.redirect('/join/event/'+event_id+'?wrong_password=true');
                return res.end();
            }
            return another.abort404(res);
        });
};
