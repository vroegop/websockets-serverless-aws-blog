import { APIGatewayProxyHandler } from 'aws-lambda';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
const dynamoClient = DynamoDBDocument.from(new DynamoDB());

export const handler: APIGatewayProxyHandler = async (event) => {
    const messageData = JSON.parse(event.body!);

    // This method will be called for every connection found in the DynamoDB table
    const sendMessage = async (connectionId: string) => {
        const apiGatewayClient = new ApiGatewayManagementApiClient({
            endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
        });
        const postToConnectionCommand = new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: Buffer.from(JSON.stringify(messageData))
        });
        return apiGatewayClient.send(postToConnectionCommand);
    };

    // Retrieve all connections
    const scanParams = {
        TableName: process.env.TABLE_NAME!,
    };
    const connections = await dynamoClient.scan(scanParams);

    // Send the message to each connection
    const sendPromises = connections.Items?.map((item) =>
        sendMessage(item.connectionId)
    );

    // If every message was received the status is 200.
    // This means we expect all connections in the database to be active ones.
    try {
        await Promise.all(sendPromises!);
        return { statusCode: 200, body: 'Message sent.' };
    } catch (err) {
        console.error('Error during sendMessage:', err);
        return { statusCode: 500, body: 'Failed to send message.' };
    }
};