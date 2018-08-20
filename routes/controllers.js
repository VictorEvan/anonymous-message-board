const { Thread } = require('../models');

// board preloader middleware
module.exports.preloadThreadsForBoard = (req, res, next, board) => {
  console.log('execute preloadThreadsForBoard', board);
  // only lowercase board names
  board = board.toLowerCase();
  req.boardName = board;
  const getThreads = Thread.find({board : board});
  getThreads
    .then( threadDocs => {
      req.threadDocs = threadDocs.length > 0 ? threadDocs : null;
      return next();
    })
    .catch( e => next(e));
}

// /api/threads/{board}
  // POST
module.exports.postThread = (req, res, next) => {
  console.log('execute postThread');
  // passed data
    // req.body.board
    // req.body.text
    // req.body.delete_password
  const board = req.boardName,
        { text, delete_password } = req.body;
  
  const newThread = new Thread({board,text,delete_password});
  
  const saveNewThread = newThread.save();
  
  saveNewThread
    .then( doc => res.redirect(`/b/${board}`))
    .catch( err => next(err));
}

// /api/replies/{board}
  // POST
module.exports.postReply = (req, res, next) => {
  console.log('execute postReply');
  const { thread_id, text, delete_password } = req.body;
  // passed data
    // req.body.thread_id
    // req.body.text
    // req.body.delete_password
  
  const newReply = {text, delete_password}
  
  const saveNewReply = 
    Thread.findOneAndUpdate(
      {_id: thread_id},
      { bumped_on: new Date,$push: { replies: newReply } },
      {new: true, setDefaultsOnInsert: true}
    ).exec();
  
  saveNewReply
    .then( doc => {
      res.redirect(`/b/${req.boardName}/?thread_id=${thread_id}`);
    })
    .catch( err => next(err));
}

// /api/threads/{board}
  // GET
module.exports.getLastTenBumpedThreads = (req, res) => {
  console.log('execute getLastTenBumpedThreads');
  // neither threads nor replies will have reported or delete_passwords
  // create array of last 10 bumped threads
    // sort by last bumped
  // only have the 3 most recent replies for each thread
  if (req.threadDocs) {
    let filteredThreads;
    filteredThreads = 
      req.threadDocs
        .slice(0, 10)
        .reduce( (final, doc) => {
            let replies = doc.replies
              .sort( (a, b) => Date.parse(b.created_on) - Date.parse(a.created_on) )
              .slice(0, 3)
              .reduce( (replyArr, reply) => [...replyArr, {
                _id: reply._id,
                text: reply.text,
                created_on: reply.created_on
              }],[]);
            return [
              ...final,
              {
                _id: doc._id,
                text: doc.text,
                created_on: doc.created_on,
                bumped_on: doc.bumped_on,
                replies,
                replycount: doc.replies.length
              }
            ];
          },[])
        .sort((a,b) => Date.parse(b.bumped_on) - Date.parse(a.bumped_on));
    return res.json(filteredThreads);
  } else {
    return res.json([]);
  }
}

// /api/replies/{board}?thread_id={thread_id}
  // GET
module.exports.getEntireThread = (req, res, next) => {
  console.log('execute getEntireThread');
  // passed queries
    // req.query.thread_id
  const id = req.query.thread_id,
        projection = '-delete_password -reported';
  const findThread = Thread.findById(id, projection).lean().exec();
  
  findThread
      .then( doc => {
      if (!doc) return res.json({});
      let filteredThread = doc;
      filteredThread.replies = doc.replies
        .reduce( (replyArr, reply) => [...replyArr, {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
      }] ,[]).sort( (a, b) => 
        Date.parse(b.created_on) - Date.parse(a.created_on)
      );
      return res.json(filteredThread);
    })
    .catch( e => next(e) );
}

// /api/threads/{board}
  // DELETE
module.exports.deleteThread = (req, res, next) => {
  // passed data
    // req.body.thread_id
    // req.body.delete_password
  const { thread_id: _id, delete_password: delete_password } = req.body;
  console.log(_id, delete_password);
  Thread.deleteOne({_id, delete_password}, (err, result) => {
    console.log(err, result);
    if (err) return next(err);
    if (result.n == 0) {
      res.status(400);
      return res.send('incorrect password');
    } else if (result.n == 1) {
      return res.send('success');
    }
  });
}

// /api/replies/{board}
  // DELETE
module.exports.markReplyAsDeleted = (req, res, next) => {
  // passed data
    // req.body.thread_id
    // req.body.reply_id
    // req.body.delete_password
  const { thread_id: _id, reply_id, delete_password } = req.body;
  const findParentThread = Thread.findById(_id).exec();
  findParentThread
    .then( doc => {
      if (!doc) return next('no parent thread found for deleting reply');
      const reply = doc.replies.id(reply_id);
      if (!reply) return next('no reply found to delete');
      if (reply.delete_password === delete_password) {
        reply.text = '[deleted]';
        const saveParentThread = reply.parent().save();
        saveParentThread
          .then( thread => {
            console.log(thread);
            res.send('success');
          })
          .catch( e => next(e));
      } else {
        console.log('reply delete password incorrect');
        res.status(400);
        res.send('incorrect password');
      }
    })
    .catch( e => next(e));
}

// /api/threads/{board}
  // PUT
module.exports.reportThread = (req, res, next) => {
  // passed data
    // req.body.thread_id
  const _id = req.body.thread_id,
        update = { reported: true },
        options = { new: true }
  const reportThread = Thread.findOneAndUpdate(_id, update, options).exec();
  reportThread
    .then( thread => {
      console.log(thread);
      if (thread.reported) return res.send('reported');
      else return res.send('report not submitted');
    })
    .catch( e => next(e));
}

// /api/replies/{board}
  // PUT
module.exports.reportReply = (req, res, next) => {
  // passed data
    // req.body.thread_id
    // req.body.reply_id
  const { thread_id: _id, reply_id } = req.body;
  const findParentThread = Thread.findById(_id).exec();
  findParentThread
    .then( doc => {
      if (!doc) return next('no parent thread found for reporting reply');
      const reply = doc.replies.id(reply_id);
      if (!reply) return next('no reply found to delete');
      reply.reported = true;
      const saveParentThread = reply.parent().save();
      saveParentThread
        .then( thread => {
          if (thread) return res.send('reported');
          else return res.send('failed to report');
        })
        .catch( e => next(e));
    })
    .catch( e => next(e) );
}