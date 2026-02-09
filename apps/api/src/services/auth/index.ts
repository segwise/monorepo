import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { secondaryStorage } from '@/auth/adapters/secondary-storage';
import { environment } from '@/libraries/environment';
import { database } from '@/services/database';
import { email } from '@/services/email';

const auth = betterAuth({
	baseURL: environment.BETTER_AUTH_URL,
	secret: environment.BETTER_AUTH_SECRET,
	trustedOrigins: [environment.APPLICATION_URL],
	basePath: '/auth',
	database: prismaAdapter(database, {
		provider: 'postgresql',
		transaction: true,
		usePlural: false,
		debugLogs: false,
	}),
	emailAndPassword: {
		enabled: true,
		disableSignUp: false,
		requireEmailVerification: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: false,
		async sendResetPassword({ user, url, token }) {
			await email.emails.send({
				from: 'Segwise <no-reply@segwise.com.br>',
				to: user.email,
				subject: 'Recuperação de senha',
				html: `
					Url: ${url}
					Token: ${token}
				`,
			});
		},
		resetPasswordTokenExpiresIn: 60 * 60,
		revokeSessionsOnPasswordReset: true,
		password: {
			hash: async (password) => {
				return await Bun.password.hash(password, 'argon2id');
			},
			verify: async ({ hash, password }) => {
				return await Bun.password.verify(password, hash, 'argon2id');
			},
		},
	},
	emailVerification: {
		async sendVerificationEmail({ user, url, token }) {
			await email.emails.send({
				from: 'Segwise <no-reply@segwise.com.br>',
				to: user.email,
				subject: 'Verificação de e-mail',
				html: `
					Url: ${url}
					Token: ${token}
				`,
			});
		},
		sendOnSignUp: true,
		sendOnSignIn: true,
		autoSignInAfterVerification: true,
		expiresIn: 60 * 60,
	},
	user: {
		changeEmail: {
			enabled: true,
			async sendChangeEmailConfirmation({ newEmail, url, token }) {
				await email.emails.send({
					from: 'Segwise <no-reply@segwise.com.br>',
					to: newEmail,
					subject: 'Verificação de novo e-mail',
					html: `
						Url: ${url}
						Token: ${token}
					`,
				});
			},
		},
		deleteUser: {
			enabled: true,
			async sendDeleteAccountVerification({ user, url, token }) {
				await email.emails.send({
					from: 'Segwise <no-reply@segwise.com.br>',
					to: user.email,
					subject: 'Confirmação de exclusão de conta',
					html: `
						Url: ${url}
						Token: ${token}
					`,
				});
			},
		},
	},
	session: {
		expiresIn: 604800,
		updateAge: 86400,
		disableSessionRefresh: false,
		storeSessionInDatabase: true,
		preserveSessionInDatabase: false,
		cookieCache: {
			enabled: false,
		},
	},
	account: {
		encryptOAuthTokens: true,
		storeAccountCookie: false,
		accountLinking: {
			enabled: true,
			trustedProviders: ['email-password'],
			allowDifferentEmails: false,
		},
		storeStateStrategy: 'database',
	},
	verification: {
		disableCleanup: false,
	},
	secondaryStorage,
	rateLimit: {
		enabled: true,
		modelName: 'rate_limit',
		window: 10,
		max: 100,
		storage: 'secondary-storage',
	},
	advanced: {
		ipAddress: {
			ip: ['x-client-ip', 'x-forwarded-for', 'cf-connecting-ip'],
			disableIpTracking: false,
		},
		useSecureCookies: true,
		disableCSRFCheck: false,
		crossSubDomainCookies: {
			enabled: true,
			domain: environment.APPLICATION_URL.replace('http://', '').replace(
				'https://',
				'',
			),
		},
		defaultCookieAttributes: {
			httpOnly: true,
			secure: true,
		},
		cookiePrefix: 'auth',
		database: {
			generateId: () => Bun.randomUUIDv7(),
		},
	},
	logger: {
		disabled: false,
		disableColors: false,
	},
	onAPIError: {
		throw: true,
		errorURL: '/auth/error',
	},
	plugins: [admin()],
});

export { auth };
