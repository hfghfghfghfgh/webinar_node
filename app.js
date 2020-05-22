//create server
const express = require('express');
const app = express();
const http = require('http');
app.set('port',3000);
const server = http.createServer(app);
const start_config = app.get('env');
const cors = require('cors');

//socket io
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

//validator requirement and configuration
const {check, validationResult } = require('express-validator');

//helpers
const dbHelper = require('./helpers/database_helpers');
const authentication = require('./helpers/authentication');
const another = require('./helpers/another');
const chat = require('./helpers/chat');

//configuration
const config = require('config');
const port = config.get(`${start_config}.app.port`);


//headers
const corsOptions= {
    origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    headers: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json({limit: '15mb'}));
app.use(bodyParser.urlencoded({
    limit: '15mb',
    extended: true
}));

//configuration for views and public folders
app.set('view engine', 'ejs');

app.use('/public',express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));

//session configuration
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const sess = {
    secret: 'sdfsdfsdfsdf',
    resave: false,
    saveUninitialized: false,
    cookie:  { maxAge: 60000 },
    store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
    }),
};

if (start_config === 'production') {
    // app.set('trust proxy', 1);
    // sess.cookie.secure = true ;
}

app.use(session(sess));

// routing for socket

io.on("connection", async socket => {
    await chat.liveGroupChatAndVideoShare(socket,io);
});

const global_site_url = config[start_config].app.laravel_url;
//routing

app.get('/admin/join/:event_id/user/:user_id',[check('event_id').isInt(),check('user_id').isInt()], async (req, res) =>  {
   try {
       if (!validationResult(req).isEmpty()) return another.abort404(res);
       const event_id = req.params.event_id;
       const user_id = req.params.user_id;
       console.log(req.session.activeUser);
       if(req.session.activeUser &&  req.session.admin) {
           return res.redirect(`/join/event/${event_id}/active/${req.session.activeUser.id}`);
       }

       const event = await dbHelper.getEventWithUser(event_id,user_id);

       if(!event) return another.abort404(res);
       const active_user = await dbHelper.createActiveSocket({first_name: event['User.name'],last_name: event['User.email'],event_id: event_id});
       await dbHelper.eventStarted(event_id);

       req.session.activeUser = active_user.dataValues;
       req.session.admin = true;
       req.session.start_time = new Date();

       res.redirect(`/join/event/${event_id}/active/${active_user.id}`);
       return res.end();
   } catch (e) {
       console.log(e);
       return another.abort404(res);
   }
});


app.get('/join/event/:event_id',[check('event_id').isInt(),], async (req, res) =>  {
    try {
        if (!validationResult(req).isEmpty()) return another.abort404(res);

        const validatorErrors = req.session.validationErrors;
        const oldValues = req.session.oldValues;
        req.session.validationErrors = null;
        req.session.oldValues = null;

        const event_id = req.params.event_id;

        const event = await dbHelper.getEvent(event_id);

        if(!event) return another.abort404(res);

        if(!event.started){
            return res.render('pages/not_started',{
                "event": event,
                "site_url" : global_site_url
            });
        }

        const oldUser = await another.createActiveUserFromSession(req,event_id);

        if(oldUser) {
            req.session.activeUser = oldUser;
            req.session.opened = false;
            res.redirect(`/join/event/${event_id}/active/${req.session.activeUser.id}`);
            return res.end();
        }

        res.render('pages/join-page', {
                "site_url" : global_site_url,
                "event_id": event_id,
                "errors": (!validatorErrors) ? [] : validatorErrors,
                "old_values": (!oldValues) ? {}: oldValues,
                "wrong_password": req.query.wrong_password,
                "password": event.authentication
            });
        return res.end();
    } catch (e) {
        console.log(e);
        return another.abort404(res);
    }
});

app.post('/join/event/:event_id',[
    check('event_id').isInt(),
    check('first_name').isString().isLength({ min: 4 }),
    check('last_name').isString().isLength({ min: 4 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;

        if (!errors.isEmpty()) {
            req.session.validationErrors = errors.array();
            another.setOldValues(req,first_name,last_name);
            return res.redirect('/join/event/'+req.params.event_id);
        }

        const event_id = req.params.event_id;

        const event = await dbHelper.getEvent(event_id);

        if(!event) return another.abort404(res);

        if(event.authentication) {
            authentication.checkPasswordAndCreateActiveUser(req,res,first_name,last_name,event_id,start_config);
        } else{
            const active_user = await dbHelper.createActiveSocket({first_name: first_name,last_name: last_name,event_id: event_id});

            req.session.activeUser = active_user.dataValues;
            req.session.opened = false;
            res.redirect(`/join/event/${event_id}/active/${active_user.id}`);
            return res.end();
        }
    } catch (e) {
        console.log(e);
        return another.abort404(res);
    }
});

app.get('/404', (req, res) => {
    res.render('pages/404',{ "site_url" : global_site_url});
    return res.end();
});

app.get('/join/event/:event_id/active/:active_id',[check('event_id').isInt(),check('active_id').isInt()],async (req, res) =>  {
    try{
        const event = await dbHelper.getActiveUserWithEvent(req.params.active_id,req.params.event_id);
        const active_user = req.session.activeUser;

        if(!active_user || !event || (event && active_user && (active_user.id != event.id)) || req.session.opened == true ) return res.redirect('/join/event/'+req.params.event_id);

        req.session.opened = true;
        res.render('pages/index',{
            "site_url" : global_site_url,
            'event_id': req.params.event_id,
            "active_id" : active_user.id,
            'admin': req.session.admin,
            "is_public" : event['Event.status'],
            "start_time" : req.session.start_time,
            "laravel_url": config[start_config].app.laravel_url
        });

        return res.end();
    } catch (e) {
        console.log(e);
        return another.abort404(res);
    }
});

app.get('/remove/sessions',(req,res) => {
    req.session.activeUser = null;
    req.session.admin = null;
    req.session.start_time = null;
    return res.sendStatus(200);
});

//start server and listen to port
server.listen(3000, () => console.log(`${config.get('global.app.name')} listening at ${config.get(`${start_config}.app.url`)}:${port}`));

