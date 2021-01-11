const nodemailer = require("nodemailer");
const logger = require("./winston");
const fs = require('fs');

async function sendPaymentConfirmation(email, refId, price, title, username, expireDate) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'no-reply@leakedsearch.com',
        pass: process.env.EMAIL_NOREPLY_PASS,
      },
    });

      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"Leaked Search" <no-reply@leakedsearch.com>', 
        to: email,
        subject: "Your membership - " + refId, // Subject line
        html: `<!doctype html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
          <head>
            <title>
            </title>
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style type="text/css">
              #outlook a{padding: 0;}
                    .ReadMsgBody{width: 100%;}
                    .ExternalClass{width: 100%;}
                    .ExternalClass *{line-height: 100%;}
                    body{margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
                    table, td{border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
                    img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}
                    p{display: block; margin: 13px 0;}
            </style>
            <!--[if !mso]><!-->
            <style type="text/css">
              @media only screen and (max-width:480px) {
                          @-ms-viewport {width: 320px;}
                          @viewport {	width: 320px; }
                      }
            </style>
            <!--<![endif]-->
            <!--[if mso]> 
            <xml> 
              <o:OfficeDocumentSettings> 
                <o:AllowPNG/> 
                <o:PixelsPerInch>96</o:PixelsPerInch> 
              </o:OfficeDocumentSettings> 
            </xml>
            <![endif]-->
            <!--[if lte mso 11]> 
            <style type="text/css"> 
              .outlook-group-fix{width:100% !important;}
            </style>
            <![endif]-->
            <style type="text/css">
              @media only screen and (max-width:480px) {
              
                      table.full-width-mobile { width: 100% !important; }
                      td.full-width-mobile { width: auto !important; }
              
              }
              @media only screen and (min-width:480px) {
              .dys-column-per-90 {
                width: 90% !important;
                max-width: 90%;
              }
              }
            </style>
          </head>
          <body>
            <div>
              <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='background:#f7f7f7;background-color:#f7f7f7;width:100%;'>
                <tbody>
                  <tr>
                    <td>
                      <div style='margin:0px auto;max-width:600px;'>
                        <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='width:100%;'>
                          <tbody>
                            <tr>
                              <td style='direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;'>
                                <!--[if mso | IE]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:540px;">
        <![endif]-->
                                <div class='dys-column-per-90 outlook-group-fix' style='direction:ltr;display:inline-block;font-size:13px;text-align:left;vertical-align:top;width:100%;'>
                                  <table border='0' cellpadding='0' cellspacing='0' role='presentation' width='100%'>
                                    <tbody>
                                      <tr>
                                        <td style='background-color:#ffffff;border:1px solid #ccc;padding:45px 75px;vertical-align:top;'>
                                          <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='' width='100%'>
                                            <tr>
                                              <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                                <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='border-collapse:collapse;border-spacing:0px;'>
                                                  <tbody>
                                                    <tr>
                                                      <td style='width:160px;'>
                                                        <img alt='Profile Picture' height='auto' src='https://leakedsearch.com/img/logodark.png' style='display:block;font-size:13px;height:auto;outline:none;text-decoration:none;width:100%;' width='130' />
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                            <tr>
                                              <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                                <div style='color:#777777;font-family:Oxygen, Helvetica neue, sans-serif;font-size:14px;line-height:21px;text-align:center;'>
                                                  <span>
                                                    <strong>
                                                      ${username},
                                                    </strong>
                                                    your membership is ready!
                                                    <br />
                                                    <br />								
                                                    You now have unlimited access to Leaked Search for 30 days! Your membership will expire on <strong>${expireDate}</strong>
                              <br><br>
                              Reference ID: <strong>${refId}</strong>
                              <br>
                                                    Amount paid: <strong>$${price}</strong>
                              <br />
                                                    <br />
                                                  </span>
                                                </div>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                                <!--[if mso | IE]>
        </td></tr></table>
        <![endif]-->
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </body>
        </html>`,
      });
    
      logger.info('Email Sent!', { to: email, subject: "Thank you for your purchase - " + refId })
  } catch (err) {
    logger.error('Email failed to send', err)
  }
}

async function sendEmailConfirmation(email, token, username) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'no-reply@leakedsearch.com',
        pass: process.env.EMAIL_NOREPLY_PASS,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Leaked Search" <no-reply@leakedsearch.com>', 
      to: email, 
      subject: "Confirm your registration", 
      html: `<!doctype html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <title>
          </title>
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style type="text/css">
            #outlook a{padding: 0;}
                  .ReadMsgBody{width: 100%;}
                  .ExternalClass{width: 100%;}
                  .ExternalClass *{line-height: 100%;}
                  body{margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
                  table, td{border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
                  img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}
                  p{display: block; margin: 13px 0;}
          </style>
          <!--[if !mso]><!-->
          <style type="text/css">
            @media only screen and (max-width:480px) {
                        @-ms-viewport {width: 320px;}
                        @viewport {	width: 320px; }
                    }
          </style>
          <!--<![endif]-->
          <!--[if mso]> 
          <xml> 
            <o:OfficeDocumentSettings> 
              <o:AllowPNG/> 
              <o:PixelsPerInch>96</o:PixelsPerInch> 
            </o:OfficeDocumentSettings> 
          </xml>
          <![endif]-->
          <!--[if lte mso 11]> 
          <style type="text/css"> 
            .outlook-group-fix{width:100% !important;}
          </style>
          <![endif]-->
          <style type="text/css">
            @media only screen and (max-width:480px) {
            
                    table.full-width-mobile { width: 100% !important; }
                    td.full-width-mobile { width: auto !important; }
            
            }
            @media only screen and (min-width:480px) {
            .dys-column-per-90 {
              width: 90% !important;
              max-width: 90%;
            }
            }
          </style>
        </head>
        <body>
          <div>
            <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='background:#f7f7f7;background-color:#f7f7f7;width:100%;'>
              <tbody>
                <tr>
                  <td>
                    <div style='margin:0px auto;max-width:600px;'>
                      <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='width:100%;'>
                        <tbody>
                          <tr>
                            <td style='direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;'>
                              <!--[if mso | IE]>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:540px;">
      <![endif]-->
                              <div class='dys-column-per-90 outlook-group-fix' style='direction:ltr;display:inline-block;font-size:13px;text-align:left;vertical-align:top;width:100%;'>
                                <table border='0' cellpadding='0' cellspacing='0' role='presentation' width='100%'>
                                  <tbody>
                                    <tr>
                                      <td style='background-color:#ffffff;border:1px solid #ccc;padding:45px 75px;vertical-align:top;'>
                                        <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='' width='100%'>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                              <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='border-collapse:collapse;border-spacing:0px;'>
                                                <tbody>
                                                  <tr>
                                                    <td style='width:160px;'>
                                                      <img alt='Profile Picture' height='auto' src='https://leakedsearch.com/img/logodark.png' style='display:block;font-size:13px;height:auto;outline:none;text-decoration:none;width:100%;' width='130' />
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                              <div style='color:#777777;font-family:Oxygen, Helvetica neue, sans-serif;font-size:14px;line-height:21px;text-align:center;'>
                                                <span>
                                                  <strong>
                                                    ${username},
                                                  </strong>
                                                  thank you for registering!
                                                  <br />
                                                  <br />
                            Your verification PIN is
                            <h1>${token}</h1>
                                                  Alternatively, you can also finish setting up your account by clicking the "Verify Account" button. If that doesn't work, copy and paste the link below into your browser's URL bar.
                                                  <br />
                                                  <br />
                                                  ${process.env.WB_DOMAIN}/auth/confirm?token=${token}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;' vertical-align='middle'>
                                              <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='border-collapse:separate;line-height:100%;'>
                                                <tr>
                                                  <td align='center' bgcolor='#477ee4' role='presentation' style='background-color:#477ee4;border:none;border-radius:5px;cursor:auto;padding:10px 25px;' valign='middle'>
                                                    <a href='${process.env.WB_DOMAIN}/auth/confirm?token=${token}' style='color:#ffffff;font-family:Oxygen, Helvetica neue, sans-serif;font-size:14px;font-weight:400;line-height:21px;margin:0;text-decoration:none;text-transform:none;' target='_blank'>
                                                      Verify Account
                                                    </a>
                                                  </td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <!--[if mso | IE]>
      </td></tr></table>
      <![endif]-->
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>`, // html body
    }).catch((err) => err);

    console.log(info)
    logger.info('Email Sent!', { to: email, subject: "Confirm your registration" })
  } catch (err) {
    logger.error('Email failed to send', err)
  }
}

async function sendPassResetConfirmation(email, token, username) {
  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: 'no-reply@leakedsearch.com',
        pass: process.env.EMAIL_NOREPLY_PASS,
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Leaked Search" <no-reply@leakedsearch.com>', 
      to: email, 
      subject: "Reset your password", 
      html: `<!doctype html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
        <head>
          <title>
          </title>
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style type="text/css">
            #outlook a{padding: 0;}
                  .ReadMsgBody{width: 100%;}
                  .ExternalClass{width: 100%;}
                  .ExternalClass *{line-height: 100%;}
                  body{margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}
                  table, td{border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
                  img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}
                  p{display: block; margin: 13px 0;}
          </style>
          <!--[if !mso]><!-->
          <style type="text/css">
            @media only screen and (max-width:480px) {
                        @-ms-viewport {width: 320px;}
                        @viewport {	width: 320px; }
                    }
          </style>
          <!--<![endif]-->
          <!--[if mso]> 
          <xml> 
            <o:OfficeDocumentSettings> 
              <o:AllowPNG/> 
              <o:PixelsPerInch>96</o:PixelsPerInch> 
            </o:OfficeDocumentSettings> 
          </xml>
          <![endif]-->
          <!--[if lte mso 11]> 
          <style type="text/css"> 
            .outlook-group-fix{width:100% !important;}
          </style>
          <![endif]-->
          <style type="text/css">
            @media only screen and (max-width:480px) {
            
                    table.full-width-mobile { width: 100% !important; }
                    td.full-width-mobile { width: auto !important; }
            
            }
            @media only screen and (min-width:480px) {
            .dys-column-per-90 {
              width: 90% !important;
              max-width: 90%;
            }
            }
          </style>
        </head>
        <body>
          <div>
            <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='background:#f7f7f7;background-color:#f7f7f7;width:100%;'>
              <tbody>
                <tr>
                  <td>
                    <div style='margin:0px auto;max-width:600px;'>
                      <table align='center' border='0' cellpadding='0' cellspacing='0' role='presentation' style='width:100%;'>
                        <tbody>
                          <tr>
                            <td style='direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;'>
                              <!--[if mso | IE]>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:top;width:540px;">
      <![endif]-->
                              <div class='dys-column-per-90 outlook-group-fix' style='direction:ltr;display:inline-block;font-size:13px;text-align:left;vertical-align:top;width:100%;'>
                                <table border='0' cellpadding='0' cellspacing='0' role='presentation' width='100%'>
                                  <tbody>
                                    <tr>
                                      <td style='background-color:#ffffff;border:1px solid #ccc;padding:45px 75px;vertical-align:top;'>
                                        <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='' width='100%'>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                              <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='border-collapse:collapse;border-spacing:0px;'>
                                                <tbody>
                                                  <tr>
                                                    <td style='width:160px;'>
                                                      <img alt='Profile Picture' height='auto' src='https://leakedsearch.com/img/logodark.png' style='display:block;font-size:13px;height:auto;outline:none;text-decoration:none;width:100%;' width='130' />
                                                    </td>
                                                  </tr>
                                                </tbody>
                                              </table>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;'>
                                              <div style='color:#777777;font-family:Oxygen, Helvetica neue, sans-serif;font-size:14px;line-height:21px;text-align:center;'>
                                                <a href='#' style='display:block; color: #477ee4; font-weight: bold; text-decoration: none;'>
                                                </a>
                                                <span>
                                                  <strong>
                                                    ${username},
                                                  </strong>
                                                  click the "Reset Password" button to reset your password. If that doesn't work, copy and paste the link below into your browser's URL bar.
                                                  <br />
                                                  <br />
                                                  ${process.env.WB_DOMAIN}/forgot?token=${token}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                          <tr>
                                            <td align='center' style='font-size:0px;padding:10px 25px;word-break:break-word;' vertical-align='middle'>
                                              <table border='0' cellpadding='0' cellspacing='0' role='presentation' style='border-collapse:separate;line-height:100%;'>
                                                <tr>
                                                  <td align='center' bgcolor='#477ee4' role='presentation' style='background-color:#477ee4;border:none;border-radius:5px;cursor:auto;padding:10px 25px;' valign='middle'>
                                                    <a href='${process.env.WB_DOMAIN}/forgot?token=${token}' style='color:#ffffff;font-family:Oxygen, Helvetica neue, sans-serif;font-size:14px;font-weight:400;line-height:21px;margin:0;text-decoration:none;text-transform:none;' target='_blank'>
                                                      Reset Password
                                                    </a>
                                                  </td>
                                                </tr>
                                              </table>
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <!--[if mso | IE]>
      </td></tr></table>
      <![endif]-->
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>`, // html body
    });

    
    logger.info('Email Sent!', { to: email, subject: "Reset pass" })
  } catch (err) {
    logger.err('Email failed to send', err)
  }
}

module.exports = {
  sendPaymentConfirmation,
  sendEmailConfirmation,
  sendPassResetConfirmation
}