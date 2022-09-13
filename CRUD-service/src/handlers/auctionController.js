const { v4: uuid } = require("uuid");
const AWS = require("aws-sdk");
const middleWare = require("../../utils/common-middleware");
const ErrorHandler = require("http-errors");

const {
  getAuctionById,
  getEndedAuctions,
  closeAuction,
} = require("../../utils/functions");

const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.createAuction = middleWare(async (event, context) => {
  const { title } = event.body;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },

    seller: "seller email here",
  };

  try {
    await dynamodb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Item: auction,
      })
      .promise();
  } catch (error) {
    throw new ErrorHandler.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
});

exports.getAuctions = middleWare(async (event, context) => {
  const { status } = event.queryStringPArameters;

  try {
    const params = {
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: "statusAndEndDate",
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeValues: {
        ":status": status,
      },
      ExpressionAttributeNames: {
        "#status": "status",
      },
    };

    const result = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (error) {
    throw new ErrorHandler.InternalServerError(error);
  }
});

exports.getAuction = middleWare(async (event, context) => {
  const { id } = event.pathParameters;

  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
});

exports.placeBid = middleWare(async (event, context) => {
  const { id } = event.pathParameters;
  const { amount } = event.body;
  let updateAuction;

  const auction = await getAuctionById(id);

  if (auction.status === "CLOSED")
    throw new ErrorHandler.Forbidden("You cannot bid on closed auctions");

  if (amount <= auction.highestBid.amount)
    throw new ErrorHandler.Forbidden(
      `Your bid must be higher than ${auction.highestBid.amount}`
    );

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression:
      "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":bidder": "bidder email here",
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamodb.update(params).promise();
    updateAuction = result.Attributes;
  } catch (error) {
    throw new ErrorHandler.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updateAuction),
  };
});

exports.process = async (event, context) => {
  try {
    const auctionsToClose = await getEndedAuctions();

    const closePromises = auctionsToClose.map(async (auction) => {
      await closeAuction(auction);
    });

    await Promise.all(closePromises);

    return {
      closed: closePromises.length,
    };
  } catch (error) {
    throw new ErrorHandler.InternalServerError(error);
  }
};
