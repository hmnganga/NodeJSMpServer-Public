const https = require("https");

module.exports = {
  //   testExportFn: function() {
  //     console.log("Modular Fns Test");
  // },
  /* Delimit functions within the module.exports section using a comma*/
  getAT: function () {
    var getOptions = {
      host: "sandbox.safaricom.co.ke",
      path: "/oauth/v1/generate?grant_type=client_credentials",
      method: "GET",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(process.env.CK + ":" + process.env.CS).toString("base64"),
        Accept: "application/json",
      },
    };
    return new Promise(function (resolve, reject) {
      https
        .request(getOptions, function (res) {
          res.setEncoding("utf-8");
          res.on("data", function (d) {
            resolve(JSON.parse(d));
          });
          res.on("error", function (e) {
            reject(e);
          });
        })
        .end();
    });
  },
  getTimeStamp: function () {
    function parseDate(e) {
      return e < 10 ? "0" + e : e;
    }
    var _date = new Date();
    var currentTime = new Date(
      _date.toLocaleString("en-us", { timeZone: "Africa/Nairobi" })
    );
    var month = parseDate(currentTime.getMonth() + 1);
    var date = parseDate(currentTime.getDate());
    var hour = parseDate(currentTime.getHours());
    var minutes = parseDate(currentTime.getMinutes());
    var seconds = parseDate(currentTime.getSeconds());
    return (
      currentTime.getFullYear() +
      "" +
      month +
      "" +
      date +
      "" +
      hour +
      "" +
      minutes +
      "" +
      seconds
    );
  },

  /* Replace customappname with your app's name*/
  processRequest: function (amount, mssidn) {
    var postBody = JSON.stringify({
      BusinessShortCode: process.env.SC,
      Password: Buffer.from(
        process.env.SC + process.env.PK + module.exports.getTimeStamp()
      ).toString("base64"),
      Timestamp: module.exports.getTimeStamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: mssidn,
      PartyB: process.env.PartyB,
      PhoneNumber: mssidn,
      CallBackURL: "https://shining-flower-utahraptor.glitch.me/hooks/lnmResponse",
      AccountReference: "LNMOnGlitch",
      TransactionDesc: "sandboxTests",
    });
    /*This generates an access_token for each request, and 
    returns a promise.*/
    var aTPromise = module.exports.getAT();

    return aTPromise.then(function(resObj) {
      return resObj["access_token"];
    }, function(err) {
      return "";
    }).then(function(_at) {
      /*If access_token is valid, proceed to invoke the LNM API*/
      var postOptions = {
          host: "sandbox.safaricom.co.ke",
          path: "/mpesa/stkpush/v1/processrequest",
          method: "POST",
          headers: {
            "Authorization": "Bearer " + _at,
            'Content-Type' : 'application/json',
            'Content-Length' : Buffer.byteLength(postBody, 'utf8')
          }        
      }
      return new Promise(function(resolve, reject) {
        var post = https.request(postOptions, function(res) {
          res.setEncoding("utf-8");
          res.on("data", function(d) {
            resolve(JSON.parse(d));
          });
          res.on("error", function(e) {
            reject(e);
          });
        });
        post.write(postBody);
        post.end();
      });
    });
  }
};