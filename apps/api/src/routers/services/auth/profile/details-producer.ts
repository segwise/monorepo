import { addMonths, setDate, startOfDay, startOfToday } from 'date-fns';
import type { Server } from '@/@types/server';
import { StatusSafe } from '@segwise/database/enums';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function registerRoutersServicesAuthProfileDetailsProducer(server: Server) {
	server.get('/details-producer', async (ctx) => {
		const brokerId = ctx.session.brokerId;
		const userId = ctx.session.userId;

		if (!brokerId) {
			throw new Error('Corretora não vinculada!');
		}

		const [quotes, safes, member] = await ctx.database.$transaction([
			ctx.database.quote.findMany({
				where: {
					producerId: userId,
					brokerId,
				},
				select: {
					insuranceCompany: {
						select: {
							name: true,
							icon: true,
						},
					},
					insured: {
						select: {
							name: true,
						},
					},
					temporaryInsured: {
						select: {
							name: true,
						},
					},
					quoteVehicle: {
						select: {
							plate: true,
							overnightPostalCode: true,
						},
					},
					status: true,
					requestedAt: true,
				},
			}),
			ctx.database.safe.findMany({
				where: {
					status: StatusSafe.active,
					producerId: userId,
					brokerId,
					OR: [
						{
							isExternal: null,
						},
						{
							isExternal: false,
						},
					],
				},
				select: {
					insuranceCompany: {
						select: {
							name: true,
							icon: true,
						},
					},
					insured: {
						select: {
							name: true,
						},
					},
					safeVehicle: {
						select: {
							plate: true,
							overnightPostalCode: true,
						},
					},
					commissionAmountProducer: true,
					requestedAt: true,
					commissionInstallments: true,
				},
			}),
			ctx.database.member.findUnique({
				where: {
					brokerId_userId: {
						userId,
						brokerId,
					},
				},
				select: {
					startOfProductionPayment: true,
					referral: true,
					invitationMessage: true,
					typeOfProduction: true,
				},
			}),
		]);

		return ctx.json(
			{
				message: member?.invitationMessage,
				referral: member?.referral,
				valueToReceive:
					safes.some(
						(a, b) => a.commissionAmountProducer?.toNumber() || 0 + b,
						0,
					) || 0,
				dateOfReceipt: (member?.startOfProductionPayment ?? [])
					.map((day) => {
						const date = startOfDay(setDate(startOfToday(), day));

						return date > startOfToday() ? date : addMonths(date, 1);
					})
					.sort((a, b) => a.getTime() - b.getTime())[0],
				quotes: quotes.map((props) => ({
					...(props.insuranceCompany && {
						...(props.insuranceCompany?.icon && {
							image: getPresignedUrl(
								ctx.storage.images,
								props.insuranceCompany.icon,
							),
						}),
						name: props.insuranceCompany?.name,
					}),
					insured: {
						name: props.temporaryInsured?.name || props.insured?.name,
					},
					vehicle: {
						plate: props.quoteVehicle?.plate,
						overnightPostalCode: props.quoteVehicle?.overnightPostalCode,
					},
					status: props.status,
					requestAt: props.requestedAt,
				})),
				safes: safes.map((props) => ({
					insuranceCompany: {
						...(props.insuranceCompany?.icon && {
							image: getPresignedUrl(
								ctx.storage.images,
								props.insuranceCompany.icon,
							),
						}),
						name: props.insuranceCompany?.name,
					},
					insured: {
						name: props.insured?.name,
					},
					vehicle: {
						plate: props.safeVehicle?.plate,
						overnightPostalCode: props.safeVehicle?.overnightPostalCode,
					},
					amount: props.commissionAmountProducer
						?.div(props.commissionInstallments || 0)
						.toNumber(),
					requestAt: props.requestedAt,
				})),
				typeOfProduction: member?.typeOfProduction,
			},
			200,
		);
	});
}

export { registerRoutersServicesAuthProfileDetailsProducer };
