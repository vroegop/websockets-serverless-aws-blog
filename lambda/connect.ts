import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());

export const handler: APIGatewayProxyHandler = async (event) => {
    // Set up the call to add the connection that called this Lambda
    const putParams = {
        TableName: process.env.TABLE_NAME!,
        Item: {
            connectionId: event.requestContext.connectionId,
            timestamp: new Date().toISOString(),
        }
    };

    // Add the connection to the database
    try {
        await dynamo.put(putParams);
        return { statusCode: 200, body: 'Connected.' };
    } catch (err) {
        console.error('Error during onConnect:', err);
        return { statusCode: 500, body: 'Failed to connect.' };
    }
};