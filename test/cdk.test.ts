import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ChatAppStack } from '../lib/chat-app-stack';

describe('ChatAppStack', () => {
    const app = new cdk.App();
    const stack = new ChatAppStack(app, 'MyTestStack');
    const template = Template.fromStack(stack);

    it('should create a DynamoDB table', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            TableName: 'ChatConnections',
        });
    });

    it('should create Lambda functions', () => {
        template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    it('should create WebSocket API', () => {
        template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
            ProtocolType: 'WEBSOCKET'
        });
    });
});