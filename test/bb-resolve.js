
var resolve = require('..');
var assert = require('better-assert');
var netrc = require('node-netrc');
var auth = netrc('api.bitbucket.org') || {};
var user = process.env.BITBUCKET_USERNAME || auth.login;
var pass = process.env.BITBUCKET_PASSWORD || auth.password;
var repo = 'stephenmathieson/testything';

describe('resolve()', function () {
  it('should work without credentials', function (done) {
    resolve(repo + '@1.0.0', null, null, function (err, ref) {
      if (err) return done(err);
      assert('1.0.0' == ref.name);
      assert('tag' == ref.type);
      done();
    });
  });

  describe('given an invalid range', function () {
    it('should not resolve', function (done) {
      resolve(repo + '@~x.y', user, pass, function (err, ref) {
        if (err) return done(err);
        assert(!ref);
        done();
      });
    });
  });

  describe('given a github repo', function () {
    it('should error with a 404', function (done) {
      resolve('component/duo@x.y.z', user, pass, function (err, ref) {
        assert(err);
        assert(404 == err.code);
        assert('component/duo@x.y.z returned 404' == err.message);
        assert(err.res);
        assert(!ref);
        done();
      });
    });
  });

  describe('given a branch', function () {
    it('should resolve the branch', function (done) {
      resolve(repo + '@foo', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('foo' == ref.name);
        done();
      });
    });

    describe('with a /', function () {
      it('should resolve', function (done) {
        resolve(repo + '@baz/bang', user, pass, function (err, ref) {
          if (err) return done(err);
          assert('baz/bang' == ref.name);
          assert('branch' == ref.type);
          done();
        });
      });
    });
  });

  describe('given a tag', function () {
    it('should resolve the tag', function (done) {
      resolve(repo + '@0.0.4', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('0.0.4' == ref.name);
        assert('tag' == ref.type);
        done();
      });
    });
  });

  describe('given no version', function () {
    it('should assume "*"', function (done) {
      resolve(repo, user, pass, function (err, ref) {
        if (err) return done(err);
        assert('1.2.3' == ref.name);
        done();
      });
    });
  });

  describe('given *', function () {
    it('should resolve to the highest tag', function (done) {
      resolve(repo + '@*', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('1.2.3' == ref.name);
        assert('tag' == ref.type);
        done();
      });
    });
  });

  describe('given a ~ range', function () {
    it('should resolve', function (done) {
      resolve(repo + '@~0.1', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('0.1.5' == ref.name);
        done();
      });
    });
  });

  describe('given a .x range', function () {
    it('should resolve', function (done) {
      resolve(repo + '@0.x', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('0.4.5' == ref.name);
        done();
      });
    });
  });

  describe('given only a major', function () {
    it('should resolve', function (done) {
      resolve(repo + '@1', user, pass, function (err, ref) {
        if (err) return done(err);
        assert('1.2.3' == ref.name);
        done();
      });
    });
  });

  describe('given a bad username/password', function () {
    it('should', function (done) {
      resolve(repo, 'stephenmathieson', 'notmypassword', function (err) {
        assert(/credentials/.test(err.message));
        done();
      });
    });
  });
});
