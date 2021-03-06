"use strict";

import Reflux  from 'reflux';
import Actions from 'appRoot/actions';
import Request from 'superagent';
import Config  from 'appRoot/appConfig';

export default Reflux.createStore({
  listenables: Actions,
  endpoint: Config.apiRoot + '/posts',

  getPostsByPage: function (page = 1, params) {
    var start = Config.pageSize * (page - 1)
      , end = start + Config.pageSize
      , query = {
        // newest to oldest
        '_sort': 'date',
        '_order': 'DESC',
        '_start': Config.pageSize * (page - 1),
        '_end': Config.pageSize * (page - 1) + Config.pageSize
      }
      , us = this
      ;

    if (typeof params === 'object') {
      // ES6 extend object
      Object.assign(query, params);
    }

    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }


    return new Promise(function (resolve, reject) {
      us.currentRequest = Request.get(us.endpoint);
      us.currentRequest
        .query(query)
        .end(function (err, ers) {
          var results = res.body;

          function complete() {
            // unfortunately if multiple request had been made
            // They would all get resolved on the first
            // invocation of this function
            // Undesireable, when we are rapid firing searches
            // Actions.getPostsByPage.completed({ start: query._start, end: query._end, results: results });
            resolve({
              start: query._start,
              end: query._end,
              results: results
            });
          }

          if (res.ok) {
            Config.loadTimeSimMs ? setTimeout(complete, Config.loadTimeSimMs) : complete();
          } else {
            reject(Error(err));
            // same outcome as above
            // Actions.getPostsByPage.failed(err);
          }
          this.currentRequest = null;
        }.bind(us));
    });
  },
  //-- ACTION HANDLERS
  onGetPost: function (id) {
    function req () {
      Request
        .get(this.endpoint)
        .query({
          id: id
        })
        .end(function (err, res) {
          if (res.ok) {
            if (res.body.length > 0) {
              Actions.getPost.completed(res.body[0]);
            } else {
              Actions.getPost.failed('Post (' + id + ') not found');
            }
          } else {
            Actions.getPost.failed(err);
          }
        });
    }
    Config.loadTimeSimMs ? setTimeout(req.bind(this), Config.loadTimeSimMs) : req();
  },
  onModifyPost: function (post, id) {
    function req () {
      Request
        [id ? 'put' : 'post'](id ? this.endpoint+'/'+id : this.endpoint)
        .send(post)
        .end(function (err, res) {
          if (res.ok) {
            Actions.modifyPost.completed(res);
            // if there's already a post in our local store we need to modify it
            // if not, add this one
            var existingPostIdx = Array.findIndex(this.posts, function (post) {
              return res.body.id == post.id;
            });

            //console.log("POST IDX", existingPostIdx);
            if (existingPostIdx > -1) {
              this.posts[existingPostIdx] = res.body;
            } else {
              this.posts.push(res.body);
            }
          } else {
            Actions.modifyPost.completed();
          }
        }.bind(this));
    }
    Config.loadTimeSimMs ? setTimeout(req.bind(this), Config.loadTimeSimMs) : req();
  }
});
