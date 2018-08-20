/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const express = require('express');
const router = express.Router();
const contr = require('./controllers');

// param method for preloading specific board doc
router.param('board', contr.preloadThreadsForBoard);

// access front end with /b/:board
router.route('/threads/:board')
  // list recent threads
  .get(contr.getLastTenBumpedThreads)
  // create thread
  .post(contr.postThread)
  // report thread
  .put(contr.reportThread)
  // delete thread with password
  .delete(contr.deleteThread);

router.route('/replies/:board')
  // show all replies on thread
  .get(contr.getEntireThread)
  // create reply on thread
  .post(contr.postReply)
  // report reply on thread
  .put(contr.reportReply)
  // change reply to '[deleted]' on thread
  .delete(contr.markReplyAsDeleted);

module.exports = router;