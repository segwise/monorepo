import type { SchemaQuoteRegister } from '@segwise/core';
import type z from 'zod';
import type { Server } from '@/@types/server.d';
import type { VehicleExchange, VehicleUsage } from '@/generated/prisma/enums';

function registerRoutersServicesQuotesByPlate(server: Server) {
	const base = server.basePath(
		`/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}`,
	);

	base.get('/', async (ctx) => {
		const plate = ctx.req.param('plate');

		const quotes = await ctx.database.quote.findFirst({
			where: {
				quoteVehicle: {
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
				quoteVehicle: {
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

		if (!quotes) {
			throw new Error('Nenhum registro encontrado!');
		}

		return ctx.json(
			{
				...(quotes.producerId && {
					producer: quotes.producerId,
				}),
				modality: quotes.modality,
				renewal: quotes.renewal || false,
				status: quotes.status,
				requestedAt: quotes.requestedAt,
				insuranceCompany: quotes.insuranceCompanyId,
				expiration: quotes.expiration,
				insured: {
					name: (quotes.insured?.name ||
						quotes.temporaryInsured?.name) as string,
					cpf: (quotes.insured?.cpf ||
						quotes.insured?.cnpj ||
						quotes.temporaryInsured?.cpf ||
						quotes.temporaryInsured?.cnpj) as string,
					birth: (quotes.insured?.birth ||
						quotes.temporaryInsured?.birth) as Date,
					phone: (quotes.insured?.phone ||
						quotes.temporaryInsured?.phone) as string,
					maritalStatus: 'common_law_marriage',
					qualificationTime: 0,
				},
				vehicle: {
					plate: quotes.quoteVehicle?.plate,
					manufacturer: (quotes.quoteVehicle?.vehicle?.manufacturer.name ||
						quotes.quoteVehicle?.vehicleWithoutPlate?.manufacturer
							?.name) as string,
					model: (quotes.quoteVehicle?.vehicle?.model ||
						quotes.quoteVehicle?.vehicleWithoutPlate?.model) as string,
					modelYear: (quotes.quoteVehicle?.vehicle?.modelYear ||
						quotes.quoteVehicle?.vehicleWithoutPlate?.modelYear) as number,
					chassi: quotes.quoteVehicle?.vehicle?.chassi,
					usage: quotes.quoteVehicle?.usage as VehicleUsage,
					exchange: (quotes.quoteVehicle?.vehicle?.exchange ||
						quotes.quoteVehicle?.vehicleWithoutPlate
							?.exchange) as VehicleExchange,
					overnightPostalCode: quotes.quoteVehicle
						?.overnightPostalCode as string,
					additional: {
						residence: {
							type: 'apartment',
							garage: 'automatic_gate',
						},
						work: 'does_not_use',
						school: 'does_not_study',
						armored: false,
						gasKit: false,
						theInsuredIsTheOwner: false,
						funded: false,
						driversUnder26: false,
					},
				},
				driver: {
					name: quotes.quoteVehicle?.driverName as string,
					cpf: quotes.quoteVehicle?.driverCPF as string,
					birth: quotes.quoteVehicle?.driverBirth as Date,
				},
			} satisfies z.infer<typeof SchemaQuoteRegister>,
			200,
		);
	});
}

export { registerRoutersServicesQuotesByPlate };
