import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GoogleOAuthService } from '../../services/google-oauth.service.js';
import { env } from '../../config/env.js';

export default async function oauthRoutes(app: FastifyInstance) {
  /**
   * GET /oauth/google
   * Redirect to Google OAuth login
   */
  app.get('/google', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!GoogleOAuthService.isConfigured()) {
        return reply.code(503).send({
          success: false,
          error: {
            code: 'OAUTH_NOT_CONFIGURED',
            message: 'Google OAuth is not configured',
          },
        });
      }

      // Get return URL from query params
      const query = request.query as { returnUrl?: string };
      const state = query.returnUrl ? encodeURIComponent(query.returnUrl) : '';

      const authUrl = GoogleOAuthService.getAuthorizationUrl(state);

      return reply.redirect(authUrl);
    } catch (error) {
      app.log.error({ error }, 'Failed to initiate Google OAuth');
      return reply.code(500).send({
        success: false,
        error: {
          code: 'OAUTH_ERROR',
          message: 'Failed to initiate Google OAuth',
        },
      });
    }
  });

  /**
   * GET /oauth/google/callback
   * Handle Google OAuth callback
   */
  app.get('/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as { code?: string; state?: string; error?: string };

      if (query.error) {
        app.log.error({ error: query.error }, 'Google OAuth error');
        return reply.redirect(`${env.FRONTEND_URL}/Login?error=oauth_denied`);
      }

      if (!query.code) {
        return reply.redirect(`${env.FRONTEND_URL}/Login?error=no_code`);
      }

      // Exchange code for tokens and get/create user
      const result = await GoogleOAuthService.handleCallback(query.code);

      // Decode return URL from state
      const returnUrl = query.state ? decodeURIComponent(query.state) : '';

      // Redirect to frontend with tokens
      // Using URL fragment to pass tokens securely (not in query params for history)
      const redirectUrl = new URL(`${env.FRONTEND_URL}/oauth/callback`);
      redirectUrl.searchParams.set('accessToken', result.accessToken);
      redirectUrl.searchParams.set('refreshToken', result.refreshToken);
      redirectUrl.searchParams.set('isNewUser', result.isNewUser.toString());
      if (returnUrl) {
        redirectUrl.searchParams.set('returnUrl', returnUrl);
      }

      return reply.redirect(redirectUrl.toString());
    } catch (error) {
      app.log.error({ error }, 'Google OAuth callback error');

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('deactivated')) {
        return reply.redirect(`${env.FRONTEND_URL}/Login?error=account_blocked`);
      }

      return reply.redirect(`${env.FRONTEND_URL}/Login?error=oauth_failed`);
    }
  });

  /**
   * GET /oauth/status
   * Check if OAuth providers are configured
   */
  app.get('/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(200).send({
      success: true,
      data: {
        google: GoogleOAuthService.isConfigured(),
      },
    });
  });
}
