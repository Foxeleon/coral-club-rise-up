#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { EmailStack } from '../lib/email-stack';

const app = new App();

new EmailStack(app, 'CoralEmailStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'eu-central-1',
    },
});

app.synth();