import { addMonths, setDate, startOfDay, startOfToday } from 'date-fns';
import type { Server } from '@/@types/server';
import { StatusSafe } from '@/generated/prisma/enums';
import { getPresignedUrl } from '@/libraries/s3/get-presigned-url';

function registerRoutersServicesAuthProfileDetailsProducer(server: Server) {
	server.get('/details-producer', async (ctx) => {
		const brokerId = ctx.session.brokerId;
		const userId = ctx.session.userId;

		if (!brokerId) {
			throw new Error('Corretora não vinculada!');
		}

		const [safes, member] = await ctx.database.$transaction([
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
				},
			}),
		]);

		return ctx.json(
			{
				valueToReceive:
					safes.some(
						(a, b) => a.commissionAmountProducer?.toNumber() || 0 + b,
						0,
					) || 0,
				dateOfReceipt: addMonths(
					startOfDay(
						setDate(startOfToday(), member?.startOfProductionPayment as number),
					),
					1,
				),
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
			},
			200,
		);
	});
}

export { registerRoutersServicesAuthProfileDetailsProducer };
