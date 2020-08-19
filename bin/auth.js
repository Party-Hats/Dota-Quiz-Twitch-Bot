const auth = require('basic-auth')

const admin = {
  name: 'admin',
  password: '1Geheim'
}

module.exports = function (request, response, next) {
  let user = auth(request);
  if (!user || !admin.name || admin.password !== user.pass) {
    response.set('WWW-Authenticate', 'Basic realm="config"')
    return response.status(401).send();
  }
  return next();
}