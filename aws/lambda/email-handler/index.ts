import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client({ region: 'eu-central-1' });

interface ContactForm {
    name?: string;
    email: string;
    message: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event): Promise<APIGatewayProxyResultV2> => {
    const headers = {
        'Access-Control-Allow-Origin': 'http://angular.coralworld.eu',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (event.requestContext.http.method === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    try {
        const body: ContactForm = JSON.parse(event.body || '{}');

        if (!body.email || !body.message) {
            return {
                statusCode: 422,
                headers,
                body: JSON.stringify({ error: 'Email and message are required' })
            };
        }

        await ses.send(new SendEmailCommand({
            FromEmailAddress: 'noreply@angular.coralworld.eu',
            Destination: { ToAddresses: ['andreywirz@gmail.com'] },
            Content: {
                Simple: {
                    Subject: {
                        Data: `Contact from ${body.name || 'visitor'}`
                    },
                    Body: {
                        Text: {
                            Data: `Reply-To: ${body.email}\n\nMessage:\n${body.message}`
                        }
                    }
                }
            }
        }));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Email sent successfully' })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};