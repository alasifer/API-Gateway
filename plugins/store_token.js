const service = require("express-gateway/lib/services/consumers/user.service")
const uuidv1 = require('uuid').v1;

const store_token = {
	name: 'store_token',
	policy: (actionParams) => {
		return (req, res, next) => {
			const opaque = uuidv1(); // token generated based on timestamp and random values
			const _write = res.write;
			res.write = (data) => {
				try {
					let body = JSON.parse(data);
					if (!body.error) {
						if (body.message) {
							_write.call(res, data)
						}
						if (body.token) {
							service.insert({
								"username": opaque,
								"jwt_token": body.token
							}).then((result) => {
								if (!result) { throw new Error }
							})
							body.token = opaque
							var cookie_option = {}
							if (actionParams.env === 'PROD') {
								cookie_option.httpOnly = true
								cookie_option.sameSite = "None"
								cookie_option.secure = true
							}
							res.cookie('token', opaque, cookie_option)
							res.cookie('userID', body.userID, cookie_option)
							res.cookie('roles', JSON.stringify(body.roles), cookie_option)
						} else {
							throw new Error
						}
					}
					body = JSON.stringify(body);
					res.setHeader('Content-Length', Buffer.byteLength(body));
					_write.call(res, body)

				} catch (error) {
					res.status(500).send({ message: "Server error" })
				}
			}
			next()
		};
	}
};

module.exports = {
	version: '1.2.0',
	init: function (pluginContext) {
		pluginContext.registerPolicy(store_token)
	}
}