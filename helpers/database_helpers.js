const models = require('../models');
const { Op } = require("sequelize");

module.exports.createActiveSocket = async ({first_name,last_name,event_id}) =>  {
    return models.ActiveSocket.create({
        first_name: first_name,
        last_name: last_name,
        event_id: event_id
    });
};

module.exports.getActiveUserWithEvent = async (active_id,event_id) => {
    return  models.ActiveSocket.findOne({
        where: {
            id: active_id
        }, include: [
            {
                model: models.Event,
                where: {
                    id: event_id
                },
                attributes: ['id','status']
            }],
        raw: true
    });
};


module.exports.getActiveUser = async (active_id) => {
    return  models.ActiveSocket.findOne({
        where: {
            id: active_id
        },
        raw: true
    });
};


module.exports.getEventWithUser = async (event_id,user_id) => {
    return models.Event.findOne({
        where: {
            id: event_id,
        },
        include: [
            {
                model: models.User,
                where: {
                    id: user_id
                },
                attributes: ['id','name','email']
            }
        ],
        raw: true
    });
};

module.exports.getEvent =async (event_id) => {
    return models.Event.findOne({
        where: {
            id: event_id,
        },
        raw: true
    });
};


module.exports.creatMessage = async(event_id,sender_id,data) => {
    return models.EventChatMessage.create({
        content: data.message,
        event_id: event_id,
        active_sockets_id: sender_id,
        active_sockets_id_no_foreign: sender_id
    });
};

module.exports.getAllMessages = async (event_id,sender_id) => {
    return  models.EventChatMessage.findAll({
        include: [
            {
                model: models.Event,
                where: {
                    id: event_id
                },
                attributes: ['id','name','type']
            },
            {
                model: models.ActiveSocket,
                attributes: ['id','first_name','last_name']
            }
        ],
        order: [
            ['created_at', 'ASC'],
        ],
        raw: true,
    });
};


module.exports.changePublicStatusInEvent = async (event_id,public) => {
    return models.Event.update({
                status: public
            },{
              where: {
                  id: event_id
              }
            })
};

module.exports.deleteActiveUser = async (id) => {
    await models.EventChatMessage.update(
    {active_sockets_id: null},
    {
     where: {
         active_sockets_id: id
     }
    });

    return models.ActiveSocket.destroy({
        where: {
            id: id
        }
    })
};


module.exports.changeParentOfMessages = async (new_id,old_id) => {

    return models.EventChatMessage.update(
        {active_sockets_id: new_id,
            active_sockets_id_no_foreign: new_id},
        {
            where: {
                active_sockets_id_no_foreign: old_id
            }
        });
};

module.exports.getAllUsers = async (event_id,sender_id) => {
    return models.ActiveSocket.findAll({
        where: {
            event_id: event_id,
            id: {
                [Op.ne] : sender_id
            }
        }
    })
};

module.exports.deleteAllUsersWithMessages = async (event_id) => {
  return models.ActiveSocket.destroy({
      where: {
          event_id: event_id
      }
  })
};


module.exports.eventStarted = async (event_id) => {
  return models.Event.update({
      started: true
  },{
      where: {
          id: event_id
      }
  })
};

module.exports.eventStop = async (event_id) => {
    return models.Event.update({
        started: false
    },{
        where: {
            id: event_id
        }
    })
}
