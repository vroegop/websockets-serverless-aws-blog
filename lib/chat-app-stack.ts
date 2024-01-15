import { Stack, StackProps, aws_dynamodb as dynamodb, aws_lambda as lambda, aws_apigatewayv2 as apigateway, aws_apigatewayv2_integrations as integrations, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';

export class ChatAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB table for storing connection pools
    const table = new dynamodb.Table(this, 'MessagesTable', {
      tableName: "ChatConnections",
      partitionKey: { name: 'connectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    // Lambda to register yourself as a websocket receiver
    const onConnectLambda = new lambda.Function(this, 'OnConnectLambda', {
      functionName: 'ConnectLambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'connect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Lambda to deregister yourself as a websocket receiver
    const onDisconnectLambda = new lambda.Function(this, 'OnDisconnectLambda', {
      functionName: 'DisconnectLambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'disconnect.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Lambda to send messages to the websocket connected clients
    const sendMessageLambda = new lambda.Function(this, 'SendMessageLambda', {
      functionName: 'MessageLambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'message.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Granting permissions to Lambda functions to interact with DynamoDB
    table.grantReadWriteData(onConnectLambda);
    table.grantReadWriteData(onDisconnectLambda);
    table.grantReadWriteData(sendMessageLambda);

    // API Gateway for WebSocket
    const webSocketApi = new apigateway.WebSocketApi(this, 'WebSocketApi', {
      connectRouteOptions: { integration: new integrations.WebSocketLambdaIntegration( 'connect', onConnectLambda ) },
      disconnectRouteOptions: { integration: new integrations.WebSocketLambdaIntegration('disconnect', onDisconnectLambda) },
      defaultRouteOptions: { integration: new integrations.WebSocketLambdaIntegration('message', sendMessageLambda ) }
    });

    // The lambda that receives messages must be allowed to tell the API Gateway to send it through to all clients
    webSocketApi.grantManageConnections(sendMessageLambda);

    // Deployment
    const stage = new apigateway.WebSocketStage(this, 'DevelopmentStage', {
      webSocketApi,
      stageName: 'dev',
      autoDeploy: true
    });

    // Output the WebSocket URL
    new CfnOutput(this, 'WebSocketUrl', {
      value: stage.url,
    });
  }
}
