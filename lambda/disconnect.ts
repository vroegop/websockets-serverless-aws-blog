import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocument.from(new DynamoDB());

export const handler: APIGatewayProxyHandler = async (event) => {
    // Set up the call to delete the connection that called this Lambda
    const deleteParams = {
        TableName: process.env.TABLE_NAME!,
        Key: {
            connectionId: event.requestContext.connectionId
        }
    };

    // Delete the connection from the database
    try {
        await dynamo.delete(deleteParams);
        return { statusCode: 200, body: 'Disconnected.' };
    } catch (err) {
        console.error('Error during onDisconnect:', err);
        return { statusCode: 500, body: 'Failed to disconnect.' };
    }
};