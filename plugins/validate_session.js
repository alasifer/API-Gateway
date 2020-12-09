const fs = require('fs');
const service = require("express-gateway/lib/services/consumers/user.service")

const jwt = require('jsonwebtoken');
const publicKey = fs.readFileSync(__dirname + '/../config/auth.key.pub');
const cookie = require("./get_cookie");
const verifyOptions = {
    audience: 'monash.fyp.management',
    algorithm: 'RS256'
};



validate_session = {
    name: 'validate_session',
    policy: (actionParams) => {
        return (req, res, next) => {
            var opaque_token;
            opaque_token = cookie.get_cookies(req)['token'] || "none";
            if (opaque_token == "none") {
                return res.status(400).send({
                    message: 'User session expired'
                })
            }
            async function getJwt(req, res, next) {
                const user = await service.find(opaque_token)
                try {
                    const verJwt = jwt.verify(user.jwt_token, publicKey, verifyOptions)
                    if (actionParams.level === 'page') {
                        res.status(200).send({
                            message: 'User session valid'
                        })
                    }
                    else if (actionParams.level === 'api_request') {
                        req.headers.authorization = user.jwt_token
                        next()
                    }
                } catch (error) {
                    if (user) {
                        const delete_record = await service.remove(user.id)
                    }
                    res.clearCookie('token')
                    res.clearCookie('userID')
                    res.clearCookie('roles')
                    res.status(400).send({
                        message: 'User session expired'
                    })
                }
            }
            getJwt(req, res, next).catch((error) => {
                res.status(500).send({
                    message: 'Gateway error'
                })
            })
        }
    }
};

module.exports = {
    version: '1.2.0',
    init: function (pluginContext) {
        pluginContext.registerPolicy(validate_session)
    }
}