$(document).ready(function () {
  /* ** Generic errorHandler fn for amount & mssidn input fields */
  function handleError(uiComponent) {
    var msg = uiComponent == "amount" ? "Amount" : "Phone Number";
    $("." + uiComponent)
      .css("border", "1px solid #e01515")
      .attr("placeholder", "Invalid " + msg);
  }

  /* ** Reset input fields' error messages  */
  function resetErrorMessages() {
    $("input").css("border", "1px solid #eee");
    $(".amount").attr("placeholder", "Enter Amount");
    $(".number").attr("placeholder", "Phone Number");
  }

  /* ** Convert valid mssidn to a uniform 254********* format */
  function parseMssidn(n) {
    var strArray = n.split("");
    strArray[0] == "0"
      ? strArray.splice(0, 1, "254")
      : strArray[0] == "+"
      ? strArray.splice(0, 1)
      : strArray;

    return strArray.join("");
  }

  /* -- Helper function to be used to update app ui wrt processing timeout */
  var defaultTimeout;
  function startCountdown() {
    $(".processing span span").text("[" + defaultTimeout + "s]");
    var counter = setInterval(function () {
      defaultTimeout--;
      var parsedTime =
        defaultTimeout < 10 ? "0" + defaultTimeout : defaultTimeout;
      if (defaultTimeout >= 0) {
        $(".processing span span").text("[" + parsedTime + "s]");
      } else {
        $(".processing span span").text("");
        clearInterval(counter);
      }
    }, 1000);
  }

  $("input").click(function () {
    resetErrorMessages();
  });

  $("#inputForm").submit(function (e) {
    $(".processing span").text("Processing");
    $(".processing i").show();
    /* Request Validation */
    var amnt = $(".amount").val();
    var number = $(".number").val();

    /*Input validation - LY1*/
    if (amnt.length != 0 && !isNaN(amnt) && amnt > 0) {
      /* Only allow +254*********, 254*********, 07******** */
      var regExPattern =
        /^(?:254|\+254|0)?(7(?:(?:[129][0-9])|(?:0[0-8])|(4[0-1]))[0-9]{6})$/;
      var isNumberValid = true;

      if (isNumberValid) {
        var data = { amnt: amnt, number: parseMssidn(number) };

        /*Form input check successful
         **Incase of input error, reset input fields to default styling*/
        resetErrorMessages();

        /* Make ajax call here */
        $.ajax({
          url: "https://shining-flower-utahraptor.glitch.me/process",
          type: "POST",
          data: data,
          dataType: "json",
          async: true,
          beforeSend: function () {
            $(".overlay-wrapper").show();
          },
          success: function (e) {
            var x =
              "Transaction Initiated" +
              "Make sure to authorize the Transaction. <br>" +
              "Processing <span></span>";
           // alert(JSON.stringify(e));
            if (e.status == "success") {
              var requestID = e.requestID;
              var listenerArgs = { requestID: requestID };
              $(".processing span").html(x);
              /*Include TransactionProcessing CountDown*/
              defaultTimeout = 100;
              startCountdown();
              /*placeholder*/
              var callBackStatus;
              var listener = setInterval(function () {
                $.ajax({
                  url: "https://shining-flower-utahraptor.glitch.me/listener",
                  type: "POST",
                  data: listenerArgs,
                  dataType: "json",
                  async: true,
                  success: function (e) {
                    var status = e.status;
                    callBackStatus = JSON.parse(e.callBackStatus);

                    if (status !== "PendingCompletion") {
                      $(".processing i").hide();
                      $(".processing span").text(
                        "Transaction Completed With a StatusCode: " + status
                      );
                      clearInterval(listener);
                      setTimeout(function () {
                        $(".overlay-wrapper").hide();
                      }, 5000);
                    }
                  },
                });
              }, 3000);

              /* Default Processing Timeout | 
                 GlobalKillSwitch [50s MAX_EXEC_TIME] 
                **Useful for when callBackURL doesnt get invoked and callBackStatus doesnt get updated from "pendingCompletion" */
              setTimeout(function () {
                clearInterval(listener);
                $(".processing i").hide();
                $(".processing span").text(
                  "Operation Timed Out |" +
                    "Error Fetching Processing Results. " +
                    "Please Try Again."
                );
                /*Allow a 4s window before closing overlay*/
                setTimeout(function () {
                  $(".overlay-wrapper").hide();
                }, 5000);
              }, 51000);
            } else {
              $(".processing span").text(
                "Error Initiating Transaction. Please Try Again."
              );
              setTimeout(function () {
                $(".overlay-wrapper").hide();
              }, 5000);
            }
          },
          error: function (e) {
            alert(e);
            $(".overlay-wrapper").hide();
            if (e.responseJSON.status == "amntErr") {
              handleError("amount");
            } else if (e.responseJSON.status == "mssidnErr") {
              handleError("number");
            }
          },
        });
      } else {
        handleError("number");
      }
    } else {
      handleError("amount");
    }
  });
});
