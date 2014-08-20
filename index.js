
/**
 * Module dependencies.
 */

var debug = require('debug')('bb-resolve');
var semver = require('semver');
var request = require('superagent');
var basic = require('basic-auth-header');
var fmt = require('util').format;

/**
 * BitBucket API.
 */

var api = 'https://bitbucket.org/api/1.0/repositories/%s/%s/%s/';

/**
 * Expose `resolve`.
 */

module.exports = resolve;

/**
 * Resolve `repo@version` with `user:password`,
 * invoking `fn(err, ref)`.
 *
 * @api public
 * @param {String} repo
 * @param {String} user
 * @param {String} password
 * @param {Function} fn
 */

function resolve(repo, user, password, fn) {
  repo = parse(repo);
  var req = fetch.bind(null, repo, headers(user, password));

  // grab all tags and attempt to resolve version
  debug('fetching tags to resolve version %s', repo.version);
  req('tags', function (err, tags) {
    if (err) return fn(err);
    var version = satisify(repo.version, tags);
    if (version) return callback(toRef('tag', version));

    // version either cannot be resolved, or is a branch
    // so we'll grab all branches and try again
    debug('fetching branches to resolve %s', repo.version);
    req('branches', function (err, branches) {
      if (err) return fn(err);
      var version = satisify(repo.version, branches);
      callback(version && toRef('branch', version));
    });
  });

  function callback(ref) {
    if (ref) {
      debug('resolved %s to %s', repo.version, ref.name);
      return fn(null, ref);
    }

    debug('could not resolve %s', repo.version);
    fn(null, null);
  }
}

/**
 * Fetch all refs of th `type` from
 * the given `repo` using `headers`.
 * Invokes `fn(err, tags)` when done.
 *
 * @api private
 * @param {Object} repo
 * @param {Object} headers
 * @param {String} type
 * @param {Function} fn
 */

function fetch(repo, headers, type, fn) {
  var url = query(repo, type);
  debug('GET %s', url);
  request
  .get(url)
  .set(headers)
  .end(function (err, res) {
    if (err) return fn(err);
    if (!res.ok) return fn(error(repo, res));
    var refs = Object.keys(res.body);
    debug('returned %d refs', refs.length);
    fn(null, refs);
  });
}

/**
 * To ref.
 *
 * @api private
 * @param {String} type
 * @param {String} version
 * @return {Object}
 */

function toRef(type, version) {
  return {
    type: type,
    name: version,
  };
}

/**
 * Satisfy `version` with `refs`.
 *
 * @api private
 * @param {String} version
 * @param {Array} refs
 * @return {String}
 */

function satisify(version, refs) {
  refs = refs.sort(sort);
  // * == highest tag
  if ('*' == version) return refs[0];
  // attempt to resolve all refs
  for (var i = 0, ref; ref = refs[i]; i++) {
    // handle
    //   foo/bar@some-branch-name -> some-branch-name
    //   foo/bar@1.0.0 -> 1.0.0
    if (version == ref) return ref;
    // skip invalid
    if (!semver.valid(ref)) continue;
    // handle first match
    if (semver.satisfies(ref, version)) return ref;
  }
  return null;
}

/**
 * Callback for `versions.sort()`.  Places
 * the versions in high-to-low order and
 * invalid versions (usually branches) at
 * the bottom.
 *
 * @api private
 * @param {String} a
 * @param {String} b
 * @return {Number}
 */

function sort(a, b) {
  if (!semver.valid(a)) return 1;
  if (semver.gt(a, b)) return -1;
  return 1;
}

/**
 * Create an error for `repo` and `res`.
 *
 * @api private
 * @param {Object} repo
 * @param {request.Response} res
 * @return {Error}
 */

function error(repo, res) {
  var msg = fmt('%s returned %d', repo.slug, res.status);
  if (401 == res.status) msg += ' (check your credentials)';
  var err = new Error(msg);
  err.res = res;
  err.code = res.status;
  return err;
}

/**
 * Get a query for `repo` and `type`.
 *
 * @api private
 * @param {Object} repo
 * @param {String} type
 * @return {String}
 */

function query(repo, type) {
  return fmt(api, repo.owner, repo.name, type);
}

/**
 * Get request headers for `user` and `password`.
 *
 * @api private
 * @param {String} user
 * @param {String} password
 * @return {Object}
 */

function headers(user, password) {
  var obj = {
    'user-agent': 'bb-resolve',
    accepts: 'application/json',
    authorization: user && password ? basic(user, password) : '',
  };
  debug('headers: %j', obj);
  return obj;
}

/**
 * Parse the given `repo` into an object holding:
 *
 *   * name
 *   * owner
 *   * version
 *   * slug
 *
 * Example:
 *
 *     parse('foo/bar@baz')
 *     // => {
 *         name: baz,
 *         owner: foo,
 *         version: baz,
 *         slug: foo/bar@baz
 *       }
 *
 * @api private
 * @param {String} repo
 * @return {Object}
 */

function parse(repo) {
  var parts = repo.split('@');
  repo = parts.shift();
  var version = parts.shift() || '*';
  var slug = repo + '@' + version;
  parts = repo.split('/');
  var owner = parts.shift();
  var name = parts.shift();
  debug('%s <-> %s %s %s', repo, name, owner, version);
  return {
    version: version,
    name: name,
    owner: owner,
    slug: slug,
  };
}
