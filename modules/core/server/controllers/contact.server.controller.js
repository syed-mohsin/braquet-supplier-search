'use strict';

var mailgun = require('mailgun-js')({ apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN });

/**
 * Send Contact Request
 */
exports.sendContactRequest = function (req, res) {
  var displayName;
  var email;

  if (req.user) {
    displayName = req.user.displayName;
    email = req.user.email;
  } else {
    displayName = req.body.fullName || 'unspecified';
    email = req.body.email || 'unspecified';
  }

  var prom = new Promise(function(resolve, reject) {
    res.render('modules/core/server/templates/contact', {
      displayName: displayName,
      email: email,
      content: req.body.content
    }, function(err, emailHTML) {
      if(err) {
        reject(err);
      }
      resolve(emailHTML);
    });
  });

  prom.then(function(emailHTML) {
    var mailList = process.env.MAILER_INTERNAL_LIST;

    var mailOptions = {
      to: mailList,
      from: process.env.MAILER_EMAIL_ID,
      subject: 'Braquet - General Contact',
      html: emailHTML
    };

    return mailgun.messages().send(mailOptions);
  })
  .then(function(resp) {
    res.json(resp);
  })
  .catch(function(err) {
    if(err) {
      res.status(400).json(err);
    }
  });
};
