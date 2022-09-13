const AWS = require("aws-sdk");
const ErrorHandler = require("http-errors");

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

module.exports.getAuctionById = async (id) => {
  let auction;

  try {
    const result = await dynamodb
      .get({ TableName: process.env.AUCTIONS_TABLE_NAME, Key: { id } })
      .promise();

    auction = result.Item;
  } catch (error) {
    throw new ErrorHandler.InternalServerError(error);
  }

  if (!auction) {
    throw new ErrorHandler.NotFound(`No record found with the given Id ${id}`);
  }

  return auction;
};

module.exports.getEndedAuctions = async () => {
  const now = new Date();

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: "statusAndEndDate",
    KeyConditionExpression: "#status = :status AND endingAt <= :now",
    ExpressionAttributeValues: {
      ":status": "OPEN",
      ":now": now.toISOString(),
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  const result = await dynamodb.query(params).promise();

  return result.Items;
};

module.exports.closeAuction = async (auction) => {
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
  };

  await dynamodb.update(params).promise();

  const { title, seller, highestBid } = auction;
  const { amount } = highestBid;

  const notifySeller = sqs
    .sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: "Bidding Closed !",
        recipient: seller,
        body: `Your item ${title} has been sold for ${amount}.`,
      }),
    })
    .promise();

  return Promise.all([notifySeller]);
};
