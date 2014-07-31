
var resolve = require('./');
var netrc = require('node-netrc');
var auth = netrc('api.bitbucket.org') || {};
var user = process.env.BITBUCKET_USERNAME || auth.login;
var pass = process.env.BITBUCKET_PASSWORD || auth.password;
var repo = process.env.REPO || 'stephenmathieson/testything';

resolve(repo, user, pass, function (err, ref) {
  if (err) throw err;
  console.log(ref);
});
