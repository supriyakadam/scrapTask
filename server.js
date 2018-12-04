var express = require('express');
var fs = require('fs');
var path = require("path");
var async = require('async');

var request = require('request');
var cheerio = require('cheerio');
var app = express();

var server = app.get("/scrapingTask", function (req, res) {
    var nextElement1 = "";
    var url = "";
    var file = fs.createWriteStream('links.txt');
    startTheProcess();
    function writeLinksToFile(data, callback) {
        async.each(data.anchorElements, function (anchorEle, cb) {
            file.write($(anchorEle).attr('href') + ':\n', function (err, data) {
                cb();
            })
        }, callback);
    }

    function writeToFile(data, callback) {
        $(data.nextElement).addClass('current');
        if (data.body) { //for home page
            file.write('\n \n' + $(data.nextElement).text() + ':\n \n', function (err, res) {
                writeLinksToFile({
                    anchorElements: $('a')
                }, function (err) {
                    callback(err, {});
                });
            });
        } else { //for other pages
            url = $(data.nextElement).attr('href');
            if (!url) {
                callback(null, "Done");
            } else {
                request(url, function (err, resp, body) {
                    var page = cheerio.load(body);
                    file.write('\n \n' + page(data.nextElement).text() + ':\n \n', function (err, res) {
                        writeLinksToFile({
                            anchorElements: page('a')
                        }, function (err) {
                            callback(err, {});
                        });
                    });

                })
            }
        }
    }

    function scrapPages(element, callback) {//recursive function
        writeToFile({
            nextElement: element
        }, function (err, res) {
            if (res == "Done") {
                callback(err, "Done Writing All the pages");
            } else {
                nextElement1 = $('nav').find('.current').last().parent().parent().next().find('a');
                scrapPages(nextElement1, callback);
            }
        })
    }

    function startTheProcess() {
        console.log("process has started");
        async.waterfall([
            function (callback) {
                request("https://medium.com/", function (err, resp, body) { //first page
                    $ = cheerio.load(body);
                    nextElement1 = $('nav a').first();
                    writeToFile({
                        nextElement: nextElement1,
                        body: {}
                    }, callback);
                })
            },
            function (data, callback) {
                nextElement1 = $('nav').find('.current').last().parent().parent().next().find('a');
                scrapPages(nextElement1, callback);
            }
        ], function (err, data) {
            console.log(data);
            if (err) {
                res.send("Something Went Wrong");
            } else {
                file.end();
                res.send(data);
            }
        })
    }

});
server.maxConnections = 5;
app.listen('8081');
console.log("server has started");