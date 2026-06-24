import type { SchemaSafeRegister } from '@segwise/core';
import type z from 'zod';
import type { Server } from '@/@types/server.d';
import type { VehicleExchange, VehicleUsage } from '@/generated/prisma/enums';

function registerRoutersServicesSafesByPlate(server: Server) {
	const base = server.basePath(
		`/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}`,
	);

	base.get('/', async (ctx) => {
		const plate = ctx.req.param('plate');

		const safe = await ctx.database.safe.findFirst({
			where: {
				safeVehicle: {
					vehicle: {
						OR: [
							{
								plate,
							},
							{
								plateAlternative: plate,
							},
						],
					},
				},
			},
			select: {
				producerId: true,
				modality: true,
				renewal: true,
				status: true,
				requestedAt: true,
				insuranceCompanyId: true,
				expiration: true,
				insured: {
					select: {
						name: true,
						cpf: true,
						cnpj: true,
						birth: true,
						phone: true,
					},
				},
				temporaryInsured: {
					select: {
						name: true,
						cpf: true,
						cnpj: true,
						birth: true,
						phone: true,
					},
				},
				safeVehicle: {
					select: {
						plate: true,
						usage: true,
						vehicle: {
							select: {
								manufacturer: {
									select: {
										name: true,
									},
								},
								model: true,
								chassi: true,
								modelYear: true,
								exchange: true,
							},
						},
						vehicleWithoutPlate: {
							select: {
								manufacturer: {
									select: {
										name: true,
									},
								},
								model: true,
								modelYear: true,
								exchange: true,
							},
						},
						overnightPostalCode: true,
						driverName: true,
						driverCPF: true,
						driverBirth: true,
					},
				},
			},
		});

		if (!safe) {
			throw new Error('Nenhum registro encontrado!');
		}

		return ctx.json(
			// @ts-expect-error
			{
				...(safe.producerId && {
					producer: safe.producerId,
				}),
				modality: safe.modality,
				renewal: safe.renewal || false,
				status: safe.status,
				requestedAt: safe.requestedAt,
				insuranceCompany: safe.insuranceCompanyId,
				expiration: safe.expiration,
				insured: {
					name: (safe.insured?.name || safe.temporaryInsured?.name) as string,
					cpf: (safe.insured?.cpf ||
						safe.insured?.cnpj ||
						safe.temporaryInsured?.cpf ||
						safe.temporaryInsured?.cnpj) as string,
					birth: (safe.insured?.birth || safe.temporaryInsured?.birth) as Date,
					phone: (safe.insured?.phone ||
						safe.temporaryInsured?.phone) as string,
				},
				vehicle: {
					plate: safe.safeVehicle?.plate,
					manufacturer: (safe.safeVehicle?.vehicle?.manufacturer.name ||
						safe.safeVehicle?.vehicleWithoutPlate?.manufacturer
							?.name) as string,
					model: (safe.safeVehicle?.vehicle?.model ||
						safe.safeVehicle?.vehicleWithoutPlate?.model) as string,
					modelYear: (safe.safeVehicle?.vehicle?.modelYear ||
						safe.safeVehicle?.vehicleWithoutPlate?.modelYear) as number,
					chassi: safe.safeVehicle?.vehicle?.chassi,
					usage: safe.safeVehicle?.usage as VehicleUsage,
					exchange: (safe.safeVehicle?.vehicle?.exchange ||
						safe.safeVehicle?.vehicleWithoutPlate?.exchange) as VehicleExchange,
					overnightPostalCode: safe.safeVehicle?.overnightPostalCode as string,
				},
				driver: {
					name: safe.safeVehicle?.driverName as string,
					cpf: safe.safeVehicle?.driverCPF as string,
					birth: safe.safeVehicle?.driverBirth as Date,
				},
			} as z.infer<typeof SchemaSafeRegister>,
			200,
		);
	});
}

export { registerRoutersServicesSafesByPlate };
