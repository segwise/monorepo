import { capitalizeFirstLetters } from '@segwise/core';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
	admin,
	createAccessControl,
	customSession,
	organization,
} from 'better-auth/plugins';
import {
	defaultRoles,
	defaultStatements,
} from 'better-auth/plugins/organization/access';
import { secondaryStorage } from '@/auth/adapters/secondary-storage';
import { getMainDomain } from '@/functions/hostname/get-main-domain';
import { environment } from '@/libraries/environment';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';
import { database } from '@/services/database';
import { email } from '@/services/email';
import { storage } from '../storage/images';

const mainDomain = getMainDomain(environment.BASE_URL);

const accessControlOrganization = createAccessControl(defaultStatements);

const accessControlOrganizationProducer = accessControlOrganization.newRole({
	...defaultStatements,
});

const auth = betterAuth({
	appName: 'Segwise',
	basePath: '/services/auth',
	baseURL: environment.BASE_URL,
	secret: environment.AUTH_SECRET,
	trustedOrigins:
		environment.NODE_ENV !== 'development'
			? [`https://*.${mainDomain}`, `https://${mainDomain}`]
			: [
					'http://localhost:3000',
					'https://localhost:3000',
					'http://localhost:3001',
					'https://localhost:3001',
					'http://localhost:3002',
					'https://localhost:3002',
				],
	database: prismaAdapter(database, {
		provider: 'postgresql',
		transaction: true,
		usePlural: false,
		debugLogs: true,
	}),
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		requireEmailVerification: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		autoSignIn: false,
		async sendResetPassword({ user, url, token }) {
			await email.emails.send({
				from: 'Segwise <security@emails.segwise.com.br>',
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
				if (
					password.startsWith('$argon2id$') ||
					password.startsWith('$argon2i$') ||
					password.startsWith('$argon2d$')
				) {
					return password;
				}

				return await Bun.password.hash(password, 'argon2id');
			},
			verify: async ({ hash, password }) => {
				return await Bun.password.verify(password, hash, 'argon2id');
			},
		},
		onPasswordReset: async ({ user }) => {
			await database.user.update({
				where: {
					id: user.id,
				},
				data: {
					emailVerified: true,
				},
			});
		},
	},
	emailVerification: {
		async sendVerificationEmail({ user, url, token }) {
			await email.emails.send({
				from: 'Segwise <security@emails.segwise.com.br>',
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
					from: 'Segwise <security@emails.segwise.com.br>',
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
					from: 'Segwise <security@emails.segwise.com.br>',
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
			allowDifferentEmails: true,
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
			domain: getMainDomain(environment.BASE_URL),
		},
		defaultCookieAttributes: {
			httpOnly: true,
			secure: true,
			sameSite: 'Lax',
		},
		cookiePrefix:
			environment.NODE_ENV === 'production'
				? 'auth'
				: `${environment.NODE_ENV}.auth`,
		database: {
			generateId: () => Bun.randomUUIDv7(),
			joins: true,
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
	plugins: [
		admin(),
		organization({
			ac: accessControlOrganization,
			roles: {
				owner: defaultRoles.owner,
				admin: defaultRoles.admin,
				producer: accessControlOrganizationProducer,
			},
			schema: {
				organization: {
					modelName: 'broker',
					additionalFields: {
						fantasy: {
							type: 'string',
							required: true,
							returned: true,
						},
						cnpj: {
							type: 'string',
							required: true,
							index: true,
							unique: true,
							returned: true,
						},
					},
				},
				invitation: {
					fields: {
						organizationId: 'brokerId',
					},
					additionalFields: {
						invitationMessage: {
							type: 'string',
							required: false,
						},
						referral: {
							type: 'string',
							required: false,
						},
						typeOfProduction: {
							type: 'string',
							required: false,
						},
						percentageOfProduction: {
							type: 'number',
							required: false,
						},
						typeOfProductionPayment: {
							type: 'string',
							required: false,
						},
						startOfProductionPayment: {
							type: 'number',
							required: false,
						},
					},
				},
				member: {
					fields: {
						organizationId: 'brokerId',
					},
					additionalFields: {
						referral: {
							type: 'string',
							required: true,
							index: true,
							unique: true,
							returned: true,
						},
					},
				},
				organizationRole: {
					modelName: 'brokerRole',
					fields: {
						organizationId: 'brokerId',
					},
				},
				session: {
					fields: {
						activeOrganizationId: 'activeBrokerId',
					},
				},
				team: {
					fields: {
						organizationId: 'brokerId',
					},
				},
			},
			requireEmailVerificationOnInvitation: false,
			async sendInvitationEmail(data) {
				const user = await database.user.findUnique({
					where: {
						id: data.invitation.inviterId,
					},
					select: {
						name: true,
					},
				});

				const url = new URL(
					`http${environment.NODE_ENV !== 'development' ? 's' : ''}://${environment.NODE_ENV !== 'development' ? 'services.' : ''}${getMainDomain(environment.APPLICATION_URL)}${environment.NODE_ENV === 'development' ? `:${environment.PORT}` : ''}`,
				);

				url.pathname = '/accept-invitation';

				url.searchParams.set('token', data.id);

				const urlString = url.toJSON();

				await email.emails.send({
					from: 'Segwise <security@emails.segwise.com.br>',
					to: data.email,
					subject: 'Aceitar convite de produção',
					html: `
						Nome: ${user?.name}
						Organização: ${capitalizeFirstLetters(data.organization.name).replace('Ltda', 'LTDA').replace('ltda', 'LTDA')}

						URL: ${urlString}
					`,
				});
			},
			invitationExpiresIn: 60 * 60 * 24 * 30,
		}),
		customSession(async ({ user, session }) => {
			if (user?.image) {
				user.image = getPresignedUrl(storage, user.image);
			}

			// @ts-expect-error
			const activeOrganizationId = session?.activeOrganizationId as
				| string
				| null
				| undefined;

			if (activeOrganizationId) {
				// @ts-expect-error
				session.brokerId = activeOrganizationId;

				await database.member
					.findUnique({
						where: {
							brokerId_userId: {
								brokerId: activeOrganizationId,
								userId: user.id,
							},
						},
						select: {
							role: true,
						},
					})
					.then((member) => {
						// @ts-expect-error
						session.brokerRole = member?.role;
					});
			}

			return {
				user,
				session,
			};
		}),
	],
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					const broker = await database.broker.findFirst({
						where: {
							members: {
								some: {
									userId: session.userId,
								},
							},
						},
						select: {
							id: true,
						},
						orderBy: {
							createdAt: 'desc',
						},
					});

					if (!broker) {
						return {
							data: session,
						};
					}

					return {
						data: {
							...session,
							activeOrganizationId: broker.id,
						},
					};
				},
			},
		},
	},
});

export { auth };
