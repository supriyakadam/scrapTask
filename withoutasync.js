  request("https://medium.com/", function (err, resp, body) {
        if (err) {
            console.log("error", err);
            res.send("Something went wrong");
        } else {
            $ = cheerio.load(body);
            var nextElement = $('nav a').first();
            var url = "https://medium.com/";

            function scrapPages(element) {
                $(element).addClass('current');
                url = $(element).attr('href');
                if (!url) {
                    return;
                }
                request(url, function (err, resp, body) {
                    $ = cheerio.load(body);
                    file.write('\n \n' + $(element).text() + ':\n \n');
                    $('a').each(function (i, link) {
                        file.write($(link).attr('href') + ':\n', function (err, data) {
                            console.log("done writing")
                        })
                    });
                })

                nextElement = $('nav').find('.current').last().parent().parent().next().find('a');
                scrapPages(nextElement);
            }
            scrapPages(nextElement); //first call
        }
    })