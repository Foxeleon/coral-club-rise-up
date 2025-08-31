import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class EmailStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // TypeScript Lambda функция
        const emailFunction = new lambdaNodejs.NodejsFunction(this, 'EmailHandler', {
            entry: path.join(__dirname, '../../lambda/email-handler/index.ts'),
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'handler',
            timeout: Duration.seconds(10),
            environment: {
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                minify: true,
                sourceMap: true,
                target: 'es2020',
                externalModules: ['@aws-sdk/*'], // AWS SDK уже есть в Lambda runtime
            },
        });

        // SES разрешения
        emailFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'ses:SendEmail',
                'ses:SendRawEmail',
            ],
            resources: ['*'],
        }));

        // HTTP API Gateway
        const httpApi = new apigateway.HttpApi(this, 'EmailApi', {
            description: 'Coral Club Contact Form API',
            corsPreflight: {
                allowOrigins: ['http://angular.coralworld.eu', 'http://localhost:3000'],
                allowMethods: [
                    apigateway.CorsHttpMethod.GET,
                    apigateway.CorsHttpMethod.POST,
                    apigateway.CorsHttpMethod.OPTIONS,
                ],
                allowHeaders: ['Content-Type', 'Authorization'],
                maxAge: Duration.days(10),
            },
        });

        // Маршрут POST /contact
        httpApi.addRoutes({
            path: '/contact',
            methods: [apigateway.HttpMethod.POST],
            integration: new integrations.HttpLambdaIntegration(
                'EmailIntegration',
                emailFunction,
            ),
        });

        // Выводим API URL
        new CfnOutput(this, 'ApiUrl', {
            value: httpApi.url!,
            description: 'Contact Form API Gateway URL',
            exportName: 'CoralEmailApiUrl',
        });
    }
}