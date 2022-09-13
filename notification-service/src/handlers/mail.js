const AWS = require("aws-sdk");

const ses = new AWS.SES({ region: process.env.ENV_REGION });

module.exports.send = async (event) => {
  const record = event.Records[0];
  const email = JSON.parse(record.body);
  const { subject, body, recipient } = email;

  const params = {
    Source: "your email here",
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Data: body,
        },
      },
      Subject: {
        Data: subject,
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();

    console.log(result);

    return result;
  } catch (error) {
    console.log(error);
  }
};
