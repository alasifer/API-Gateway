const service = require("express-gateway/lib/services/consumers/user.service")
const cookie = require('./get_cookie');

logout = {
    name: 'logout',
    policy: (actionParams) => {
        return (req, res, next) => {
            const opaque_token = cookie.get_cookies(req)['token'] || "none";
            if (opaque_token == "none") {
                res.status(400).send({
                    message: 'User session expired'
                })
            }
            async function delete_record(req, res, next) {
                const user = await service.find(opaque_token)
                if (user) {
                    const remove = await service.remove(user.id)
                }
                res.clearCookie('token')
                res.clearCookie('userID')
                res.clearCookie('roles')
                res.status(200).send({ message: 'User has logged out' })
            }
            delete_record(req, res, next).catch((error) => {
                res.status(500).send({ message: 'Server error' })
            })
        }
    }
}

module.exports = {
    version: '1.2.0',
    init: function (pluginContext) {
        pluginContext.registerPolicy(logout)
    }
}