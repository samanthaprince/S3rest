'use strict';

var Files = require(__dirname + '/../models/file_model.js');
var Users = require(__dirname + '/../models/user_model.js');
var express = require('express');
var userRouter = express.Router();

var AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();
s3.listBuckets(function(err, data) {
  if (err) { console.log('Error: ', err); }
  else {
    for (var index in data.Buckets) {
      var bucket = data.Buckets[index];
      console.log('Bucket: ', bucket.Name, ' : ', bucket.CreationDate);
    }
  }
});

userRouter.get('/users', (req, res) => {
  Users.find({}, function(err, user) {
    if (err) {
      res.status(500).json({msg: 'Internal Server Error'});
    }
    res.json(user);
  });
});

userRouter.get('/users/:id', (req, res) => {
  Users.findById(req.params.id, (err, user) => {
    if (err) {
      console.error(err);
    }
    res.json(user);
  });
});

userRouter.post('/users', (req, res) => {
  var newUser = new Users (req.body);
  newUser.save((err, user) => {
    if (err) {
      console.error(err);
    }
    res.json(user);
  });
});

// userRouter.post('/users', (req, res) => {
//   var newUser = new User(req.body);
//   console.log(newUser);
//   newUser.save((err, user) => {
//     if (err) {
//       res.status(500);
//       res.json({msg:'user save failed'});
//       // console.error(err);
//     } else {
//       res.status(200);
//       var params = { Bucket: 'sprince', Key: req.body.name + '/'};
//       console.log('Params: ' + params);
//       s3.putObject(params, (err, user) => {
//         if (err) {
//           console.error(err);
//         } else {
//           console.log('some ' + user);
//         }
//       });
//       res.send(user);
//     }
//   });
// });

userRouter.put('/users/:id', (req, res) => {
  Users.findByIdAndUpdate(req.params.id, req.body, (err, user) => {
    if (err) return res.send(err);
    res.json(user);
  });
});

userRouter.delete('/users/:id', (req, res) => {
  Users.findById(req.params.id, (err, user) => {
    user.remove(() => {
      res.json({message: 'user removed'});
    });
  });
});

// userRouter.get('/users/:id/files', (req, res) => {
//   Users.findById(req.params.id)
//     .populate('files', 'url')
//     .exec((err, user) => {
//       res.json(user);
//     });
// });

userRouter.get('/users/:user/files', (req, res) => {
  console.log('/users/:user/files GET route hit');
  Users.findById(req.params.user)
    .populate('files', 'url')
    .exec((err, user) => {
      console.log('user:' + user);
      res.json(user);
    });
});
userRouter.post('/users/:id/files', (req, res) => {
  console.log('/users/:id/files POST route hit');
  var userId = req.params.user;
  var fileName = req.body.fileName;
  var fileContent = req.body.content;
  var url;
  Users.findById(req.params.id, function (err, user) {
    var params = {Bucket: 'sprince', Key: fileName, Body: fileContent};
    s3.putObject(params, function(err, data) {
      console.log(data);
      if (err) {
        console.log(err);
      }
        else  {
        console.log('Successfully uploaded data to myBucket/myKey');
      }
      var urlParams = {Bucket: 'sprince', Key: fileName};
      url = s3.getSignedUrl('getObject', urlParams, function (err, url) {
        if (err) {
          return console.log(err);
        } else {
          var newFile = new Files({fileName: fileName, url: url});
          newFile.save((err, file) => {
            if (err) {
              console.log(err);
            }
            console.log('id:' + file.id);
            var fileId =  file.id;
            Users.findOne({_id: userId}, function (err, file) {
              user.files.push(fileId);
              user.save();
              console.log(file);
              console.log(user);
              res.json({msg:'it happened'});
            });
          });
          console.log('url is', url);
        }
      });
    });
  });
});

userRouter.get('/files', (req, res) => {
  console.log('/files GET route hit');
  Files.find({},(err, data) => {
    if (err) {
      res.status(500).json({msg: 'Internal Server Error'});
    }
    res.json(data);
  });
});

userRouter.get('/files/:id', (req, res) => {
  Files.findById(req.params.id, (err, file) => {
    if (err) {
      console.error(err);
    }
    res.json(file);
  });
});

// userRouter.put('/files/:id', (req, res) => {
//   Files.findByIdAndUpdate(req.param.id, req.body, (err, file) => {
//     if (err) return res.send(err);
//     res.json(file);
//   });
// });

userRouter.delete('/users/:user/files/:file', (req, res) => {
  var fileName;
  console.log('/files/:id DELETE route hit');
  Files.findById(req.params.file, (err, file) => {
    fileName = file.fileName;
    console.log('filename of null: ' + file);
    var params = {
      Bucket: 'samanthaprince',
      Key: fileName
    };
    s3.deleteObject(params, function (err, data) {
      if (data) {
        console.log('File deleted successfully');
      }
      else {
        console.log('Check if you have sufficient permissions : ' + err);
      }
    });
  });

  Users.findOneAndUpdate({_id:req.params.user}, {$pull: {files:req.params.file}}, (err, user) => {
    console.log('user' + user);
    res.json(user);
  });
});

module.exports = userRouter;
