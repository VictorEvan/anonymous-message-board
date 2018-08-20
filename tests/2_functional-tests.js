/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let test_thread_id;
  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('redirect after creating a post', function(done) {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            board: 'test',
            text: 'test text',
            delete_password: 'delete_pw'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.headers['content-type'], 'text/html; charset=UTF-8')
            done();
        });
      }); 
    });
    
    suite('GET', function() {
      test('get array of latest threads', function(done) {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], '_id');
            test_thread_id = res.body[0]['_id'];
            assert.property(res.body[0], 'text');
            assert.property(res.body[0], 'created_on');
            assert.property(res.body[0], 'bumped_on');
            assert.property(res.body[0], 'replies');
            assert.isArray(res.body[0].replies);
            assert.property(res.body[0], 'replycount');
            done();
        });
      });
    });
    
    suite('PUT', function() {
      test('report a thread', function(done) {
        chai.request(server)
          .put('/api/threads/test')
          .send({thread_id: test_thread_id})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('incorrect password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: test_thread_id,
            delete_password: 'wrong password'
          })
          .end((err, res) => {
            assert.equal(res.status, 400);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
      test('correct password', function(done) {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: test_thread_id,
            delete_password: 'delete_pw'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    let test_thread_id, test_reply_id;
    
    suite('SET UP ENVIRONMENT', function() {
      test('create new thread', done => {
        chai.request(server)
          .post('/api/threads/test')
          .send({
            board: 'test',
            text: 'test text',
            delete_password: 'delete_pw'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            done();
        });
      });
      test('get thread', done => {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body[0], '_id');
            test_thread_id = res.body[0]['_id'];
            done();
        });
      });
    });
    
    suite('POST', function() {
      console.log('test_thread_id: ', test_thread_id);
      test('redirect after posting a reply', done => {
        chai.request(server)
          .post('/api/replies/test')
          .send({
            thread_id: test_thread_id,
            text: 'reply text',
            delete_password: 'delete_pw'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.headers['content-type'], 'text/html; charset=UTF-8')
            done();
        });
      });
    });
    
    suite('GET', function() {
      test('get entire thread', done => {
        chai.request(server)
          .get('/api/replies/test')
          .query({thread_id: test_thread_id})
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'text');
            assert.property(res.body, 'created_on');
            assert.property(res.body, 'bumped_on');
            assert.property(res.body, 'replies');
            assert.isArray(res.body.replies);
            assert.property(res.body.replies[0], '_id');
            test_reply_id = res.body.replies[0]['_id'];
            assert.property(res.body.replies[0], 'text');
            assert.property(res.body.replies[0], 'created_on');
            done();
        });
      });
    });
    
    suite('PUT', function() {
      test('report a reply', done => {
        chai.request(server)
          .put('/api/replies/test')
          .send({
            thread_id: test_thread_id,
            reply_id: test_reply_id
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'reported');
            done();
        });
      });
    });
    
    suite('DELETE', function() {
      test('incorrect password', done => {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: test_thread_id,
            reply_id: test_reply_id,
            delete_password: 'wrong password'
          })
          .end((err, res) => {
            assert.equal(res.status, 400);
            assert.equal(res.text, 'incorrect password');
            done();
        });
      });
      test('correct password', done => {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: test_thread_id,
            reply_id: test_reply_id,
            delete_password: 'delete_pw'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
        });
      });
    });
    
  });

});
