const superagent = require("superagent");
const _ = require("lodash");
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const async = require("async");
const sanitize = require("sanitize-filename");
const vtt2srt = require("node-vtt-to-srt");
const progress = require("request-progress");
const ProgressBar = require("progress");
const queryString = require("query-string");
const path = require("path");
const session = require("./session");
const files = require("./files");

let HOST = "https://www.udemy.com";
const agent = superagent.agent();

_.forEach(session.headers, function(value, key) {
  agent.set(key, value);
});

const login = function(username, password, business) {
  if (!_.isEmpty(business)) {
    HOST = HOST.replace("www", business);
  }
  return new Promise(function(resolve, reject) {
    let login_url = `${HOST}/join/login-popup/`;
    console.log(login_url);
    let access_token, client_id;
    let payload = { email: username, password: password };
    agent
      .get(login_url)
      .then(res => {
        var $ = cheerio.load(res.text);
        payload["csrfmiddlewaretoken"] = $(
          "input[name='csrfmiddlewaretoken']"
        ).val();
      })
      .then(() => {
        payload["locale"] = "en_US";

        return agent
          .post(login_url)
          .type("form")
          .send(payload);
      })
      .then(res => {
        res.headers["set-cookie"].forEach(function(a) {
          let b = a
            .trim()
            .split(";")[0]
            .split("=");
          if (b[0] == "access_token") {
            access_token = b[1];
            return true;
          } else if (b[0] == "client_id") {
            client_id = b[1];
            return true;
          }
        });

        if (access_token && client_id) {
          session.set_auth_headers(HOST, access_token, client_id);

          resolve({
            access_token,
            client_id
          });
        } else {
          reject(new Error("Cannot logging in"));
        }
      })
      .catch(r => {
        reject(r);
      });
  });
};

const getCourseList = async function() {
  const get_url = `${HOST}/api-2.0/users/me/subscribed-courses?page_size=500`;
  // console.log(get_url);
  session.course_list = [];
  return _fetchCourses(get_url);
};

const fetchCourseData = function({ id }) {
  const all_videos_list = [];
  let resolution_choices = [];
  const course_id = id;

  course_url = `${HOST}/api-2.0/courses/${course_id}/cached-subscriber-curriculum-items?page_size=1400&fields[lecture]=@min,object_index,asset,supplementary_assets,sort_order,is_published,is_free&fields[quiz]=@min,object_index,title,sort_order,is_published&fields[practice]=@min,object_index,title,sort_order,is_published&fields[chapter]=@min,description,object_index,title,sort_order,is_published&fields[asset]=@min,title,filename,asset_type,external_url,download_urls,stream_urls,length,status`;
  const options = {
    url: course_url,
    headers: session.headers
  };
  let chapter = "";
  return new Promise(function(resolve, reject) {
    try {
      request.get(options, function(e, r, b) {
        if (e) {
          new Error("Error fetching course data");
        }
        const course_data = JSON.parse(b);

        const course_data_len = course_data["results"].length;

        let setvidres;
        for (let i = 0; i < course_data_len; i++) {
          let item = course_data["results"][i];
          if (item["_class"] == "chapter") {
            //edited to get current chapter number
            chapter = item["object_index"] + " - " + item["title"];
            continue;
          }

          if (item["_class"] == "lecture") {
            let asset = item["asset"];
            if (asset["asset_type"] === "Video") {
              let videos;

              if (item.is_downloadable) {
                videos = item.asset.download_urls.Video;
              } else {
                videos = item.asset.stream_urls.Video;
              }

              const object = {
                chapter: chapter,
                course_id: course_id,
                lecture_id: item["id"],
                //added to get current video number
                video_number: item["object_index"],
                attachments: [],
                videos: videos,
                type: "v"
              };
              videos.map(v => {
                resolution_choices.push(v.label);
              });
              resolution_choices = _.uniq(resolution_choices);
              //extract_lecture_url(course_id,item['id']);

              if (
                item["supplementary_assets"] &&
                item["supplementary_assets"].length
              ) {
                object["attachments"] = _.filter(
                  item["supplementary_assets"],
                  o => o.asset_type == "File"
                );
              }
              if (!setvidres) {
                setvidres = object;
              }
              all_videos_list.push(object);
            } else if (asset["asset_type"] === "Article") {
              const object = {
                chapter: chapter,
                course_id: course_id,
                lecture_id: item["id"],
                attachments: [],
                type: "a"
              };

              if (
                item["supplementary_assets"] &&
                item["supplementary_assets"].length
              ) {
                object["attachments"] = _.filter(
                  item["supplementary_assets"],
                  o => o.asset_type == "File"
                );
              }

              all_videos_list.push(object);
            }
          }
        }

        resolve({ videos: all_videos_list, resolution_choices });

        // set_video_resolution(resolution_choices,function () {

        // })
      });
    } catch (e) {
      reject(new Error(e));
    }
  });
};

const initializeDownload = function({ videos, selectedResolution }, store) {
  return new Promise(function(resolve, reject) {
    async.eachSeries(
      videos,
      (item, cb) => {
        item.resolution = selectedResolution;
        // console.log('o',item);
        _readyDownloadQueue(item, cb, store);
        // console.log(store.download_queue[item.course_id].downloadQueue)
      },
      function(err, result) {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      }
    );
  });
};

const startDownload = function(
  { id, downloadQueue, selectedResolution },
  store
) {
  return new Promise(function(resolve, reject) {
    async.eachSeries(
      downloadQueue,
      (item, cb) => {
        item.resolution = selectedResolution;
        _download(item, cb, store);
      },
      function(err, result) {
        if (err) {
          reject(err);
          return;
        }

        resolve(result);
      }
    );
  });
};

function _readyDownloadQueue(item, callback, store) {
  const resolution = item.resolution;
  let video_number = 1;
  let course_id = item.course_id;
  let lecture_id = item.lecture_id;
  const vstore = store.download_queue[course_id];

  if (item.type == "v") {
    if (item.attachments && item.attachments.length) {
      async.eachSeries(
        item.attachments,
        function(attachment, cb) {
          var get_url = `${HOST}/api-2.0/users/me/subscribed-courses/${course_id}/lectures/${lecture_id}/supplementary-assets/${attachment.id}?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4`;

          var options = {
            url: get_url,
            headers: session.headers
          };

          request.get(options, function(e, r, b) {
            if (e) {
              new Error("Error occured during getting lecture");
            }
            console.log(b);
            let json_source = JSON.parse(b) || JSON.parse(JSON.stringify(b));
            let url_link = json_source.download_urls.File[0];
            let element = {
              state: "P"
            };
            let file, ext;
            let query_obj = queryString.parse(url_link.file);
            console.log(url_link);
            if (!query_obj.filename) {
              query_obj.filename = json_source.title;
              element.title = json_source.title.split(".").shift();
            }
            file = query_obj.filename.split(".");
            ext = file.pop();

            element.course_id = course_id;
            element.lecture_id = lecture_id;
            element.id = course_id + "-" + lecture_id + "-" + attachment.id;
            element.data_url = unescape(url_link.file);
            element.extension = ext;
            if (!element.title) element.title = file.join(" ");
            element.chapter = item.chapter;
            store.download_queue[course_id].downloadQueue.push(element);
            cb();
          });
        },
        function(err) {
          if (err) {
            new Error(err);
          }
        }
      );
    }

    var get_url = `${HOST}/api-2.0/users/me/subscribed-courses/${course_id}/lectures/${lecture_id}?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls,captions,tracks&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4`;
    var options = {
      url: get_url,
      headers: session.headers
    };

    try {
      request.get(options, function(e, r, b) {
        if (e) {
          new Error("Error occured during getting lecture");
        }

        let json_source = JSON.parse(b) || JSON.parse(JSON.stringify(b));

        var list_videos = {};
        if (json_source.asset.is_downloadable) {
          var videos = json_source.asset.download_urls.Video;
        } else {
          var videos = json_source.asset.stream_urls.Video;
        }

        for (var i = 0; i < videos.length; i++) {
          list_videos[videos[i].label] = videos[i];
        }

        var url =
          list_videos[resolution] ||
          list_videos["Auto"] ||
          list_videos["720"] ||
          list_videos["360"];
        if (!url) {
          new Error("Unknown video resolution");
        }

        var url_link = url;
        var query_obj = url_link.type.split("/").pop();
        var element = {
          state: "P"
        };
        element.course_id = course_id;
        element.lecture_id = lecture_id;
        element.id = course_id + "-" + lecture_id;
        element.data_url = unescape(url_link.file);
        element.extension = url_link.type.split("/").pop();
        element.title = json_source.title;
        element.chapter = item.chapter;
        element.resolution = resolution;
        element.number = video_number++;
        element.subs = [];
        if (!_.isEmpty(json_source.asset.tracks)) {
          json_source.asset.tracks.map(function(track) {
            var query_obj = queryString.parse(track.src);
            var file = query_obj["response-content-disposition"].split(".");
            var ext = file.pop();

            element.subs.push({
              lang: track.label,
              url: unescape(track.src),
              file: file[0],
              ext: ext
            });
          });
        }

        vstore.downloadQueue.push(element);
        //console.log(element);
        callback();
      });
    } catch (e) {
      new Error("Error occured during getting lecture");
    }

    /** */
  } else if (item.type == "a") {
    async.eachSeries(
      item.attachments,
      function(attachment, cb) {
        var get_url = `${HOST}/api-2.0/users/me/subscribed-courses/${course_id}/lectures/${lecture_id}/supplementary-assets/${attachment.id}?fields[asset]=@min,download_urls,stream_urls,external_url,slide_urls&fields[course]=id,is_paid,url&fields[lecture]=@default,view_html,course&page_config=ct_v4`;

        var options = {
          url: get_url,
          headers: session.headers
        };

        request.get(options, function(e, r, b) {
          if (e) {
            new Error("Error occured during getting lecture");
          }
          console.log(b);
          let json_source = JSON.parse(b) || JSON.parse(JSON.stringify(b));

          // console.log(json_source);
          var url_link = json_source.download_urls.File[0];
          let element = {
            state: "P"
          };
          let file, ext;
          let query_obj = queryString.parse(url_link.file);
          console.log(url_link);
          if (!query_obj.filename) {
            query_obj.filename = json_source.title;
            element.title = json_source.title.split(".").shift();
          }

          file = query_obj.filename.split(".");
          ext = file.pop();
          element.course_id = course_id;
          element.lecture_id = lecture_id;
          element.id = course_id + "-" + lecture_id + "-" + attachment.id;
          element.data_url = unescape(url_link.file);
          element.extension = ext;
          if (!element.title) element.title = file.join(" ");
          element.chapter = item.chapter;
          vstore.downloadQueue.push(element);
          //console.log(element);
          cb();
        });
      },
      function(err) {}
    );

    callback();
  }
}

const _fetchCourses = function(url) {
  var options = {
    url: url,
    headers: session.headers
  };
  return new Promise(function(resolve, reject) {
    request.get(options, function(e, r, b) {
      if (e) {
        reject(new Error("Error occured during fetching courses"));
      }
      try {
        let list = JSON.parse(b);
        if (list.next) {
          session.course_list = session.course_list.concat(list.results);
          _fetchCourses(list.next, cb);
        } else {
          session.course_list = session.course_list.concat(list.results);
          resolve(session.course_list);
        }
      } catch (e) {
        reject(new Error("Error could not fetch courses"));
      }
    });
  });
};

function _bytesToSize(bytes, decimals) {
  if (bytes == 0) return "0 Bytes";
  var k = 1000,
    dm = decimals || 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

function _convertTime(input, separator) {
  var pad = function(input) {
    return input < 10 ? "0" + input : input;
  };
  return [
    pad(Math.floor(input / 3600)),
    pad(Math.floor((input % 3600) / 60)),
    pad(Math.floor(input % 60))
  ].join(typeof separator !== "undefined" ? separator : ":");
}

function _download(dataObj, callback, store) {
  const vstore = store.download_queue[dataObj.course_id];
  let downloadQueue = vstore.downloadQueue;
  let current_index = _.findIndex(
    vstore.downloadQueue,
    o => o.id == dataObj.id
  );
  let bar;
  let fileUrl = dataObj.data_url,
    base_path = dataObj.output
      ? files.getCurrentDirectoryBase() + path.sep + dataObj.output
      : files.getCurrentDirectoryBase(),
    //edited to get current file with its chapter number
    filename = dataObj.number
      ? dataObj.number + " - " + sanitize(dataObj.title)
      : sanitize(dataObj.title),
    title = filename + "." + dataObj.extension,
    apiPath = _.isEmpty(dataObj.subs)
      ? base_path + path.sep + sanitize(dataObj.chapter) + path.sep + title
      : base_path +
        path.sep +
        sanitize(dataObj.chapter) +
        path.sep +
        filename +
        path.sep +
        title,
    total_size = 0,
    total_downloaded = 0,
    remaining_time = 0,
    save_path = _.isEmpty(dataObj.subs)
      ? base_path + path.sep + sanitize(dataObj.chapter)
      : base_path + path.sep + sanitize(dataObj.chapter) + path.sep + filename;
  console.log();
  console.log(`Chapter : ${dataObj.chapter}`.green);
  if (dataObj.resolution) {
    console.log(`Video :  ${title}`.green);
    console.log(`Resolution :  ${dataObj.resolution}p`.green);
  } else {
    console.log(`File :  ${title}`.green);
  }
  console.log(`Location : ${apiPath}`.green);

  if (dataObj.state == "C") {
    console.log("Already downloaded".green);
    callback();
  } else {
    fs.ensureDir(save_path, function(err) {
      if (err) {
        callback(err);
        return;
      }

      // The options argument is optional so you can omit it
      req = progress(request(fileUrl), {})
        .on("request", function(req) {
          downloadQueue[current_index].state = "R";
          store.download_queue[dataObj.course_id].downloadQueue = downloadQueue;
          console.log();
          bar = new ProgressBar(
            "    downloading :bar :percent [:t_downloaded]  TOTAL SIZE :t_size / TIME REMAINING :download_time :complet".green,
            {
              complete: "\u2588",
              incomplete: "\u2591",
              width: 50,
              total: 100
            }
          );
        })
        .on("progress", function(state) {
          // The state is an object that looks like this:
          // {
          //     percent: 0.5,               // Overall percent (between 0 to 1)
          //     speed: 554732,              // The download speed in bytes/sec
          //     size: {
          //         total: 90044871,        // The total payload size in bytes
          //         transferred: 27610959   // The transferred payload size in bytes
          //     },
          //     time: {
          //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
          //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
          //     }
          // }

          total_size = _bytesToSize(state.size.total);
          remaining_time = _convertTime(state.time.remaining);
          total_downloaded = _bytesToSize(state.size.transferred);

          bar.update(state.percent, {
            complet: "",
            t_size: total_size,
            download_time: remaining_time,
            t_downloaded: total_downloaded
          });
        })
        .on("error", function(err) {
          console.log();
          console.log("Error Downloading please try again !!".red);
        })
        .on("end", function() {
          bar.update(1, {
            complet: "\u2713",
            t_size: total_size,
            download_time: remaining_time,
            t_downloaded: total_size
          });
          //console.log("\u2713");
          console.log("\n");
          downloadQueue[current_index].state = "C";
          store.download_queue[dataObj.course_id].downloadQueue = downloadQueue;
          //  jsonfile.writeFileSync(tmp_file, download_queue);
          if (!_.isEmpty(dataObj.subs)) {
            async.eachSeries(
              dataObj.subs,
              function(track, cb) {
                track.lang = track.lang.replace("[Auto]", "");
                var r = request(track.url)
                  .pipe(vtt2srt())
                  .pipe(
                    fs.createWriteStream(
                      save_path +
                        path.sep +
                        filename +
                        "_" +
                        track.lang +
                        ".srt"
                    )
                  );

                cb();
              },
              function(err) {
                callback();
              }
            );
          } else {
            callback();
          }
        })
        .pipe(fs.createWriteStream(apiPath));
    });
  }
}

module.exports = {
  login,
  getCourseList,
  fetchCourseData,
  initializeDownload,
  startDownload
};
