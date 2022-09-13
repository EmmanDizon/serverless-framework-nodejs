---

##creating boilerplate

procedures:
yarn add serverless
configure aws cli
serverless create -t aws-nodejs

deploy -> serverless deploy
redeploy function -> serverless deploy function --function createAuction

##dynamoDB
is a fully managed serverless, no sql database provided by amazon web services.
fully managed means you do not have to insure your db is running as you traditionally would.
that is a guarantee you get from AWS.

it automatically spread your data and traffic across sufficient number of servers to handle your throughput
and storage requirements to ensure consistent and fast performance

everything on dynamodb stored on SSDs and is automatically replicated across multiple availability zones
providing high availability and data durability

#dynamodb components: 1. tables 2. items (data) 3. attributes

#Query vs scan
dynamo db allows us to perform searches by either querying or scanning.

scan -> scan through the entire table w/c could have performance implications, this should be the last resort.
query -> allows you to run searches using a PK or secondary indexes. when querying, you will always define a partition key
and optionally define a sort key (SK). and this will be way more performance and the recommended way to operate at a regular basis when you need to search your dynamodb table

when creating table, must specify the PK. it helps uniquely identify data in the table.

two types of PK

1. Partition key
2. Composite primary key (partition key and sort key)

#Secondary index:
global secondary index -> set an index other than PK.

local secondary index -> same PK but different sort key.

manually command cloud watch logs -> serverless logs -f processAuctions(function name)
you can specify also the time ago logs (serverless logs -f processAuctions --startTime 1m/h)

invoke function -> serverless invoke -f _function name here_ -l
