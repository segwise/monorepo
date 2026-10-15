import type { SchemaQuoteRegister } from '@segwise/core';
import type z from 'zod';
import type { Server } from '@/@types/server.d';
import type { VehicleExchange, VehicleUsage } from '@segwise/database/enums';
import { notTestProducer } from '@/libraries/dashboard/metrics';

function registerRoutersServicesQuotesByPlate(server: Server) {
	const base = server.basePath(
		`/:plate{^[A-Za-z]{3}[0-9][A-Za-z0-9][0-9]{2}$}`,
	);

	base.get('/', async (ctx) => {
		const plate = ctx.req.param('plate');

		const quote = await ctx.database.quote.findFirst({
			where: {
				AND: [notTestProducer],
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

		if (!quote) {
			throw new Error('Nenhum registro encontrado!');
		}

		return ctx.json(
			{
				...(quote.producerId && {
					producer: quote.producerId,
				}),
				modality: quote.modality,
				renewal: quote.renewal || false,
				status: quote.status,
				requestedAt: quote.requestedAt,
				insuranceCompany: quote.insuranceCompanyId,
				expiration: quote.expiration,
				insured: {
					name: (quote.insured?.name || quote.temporaryInsured?.name) as string,
					cpf: (quote.insured?.cpf ||
						quote.insured?.cnpj ||
						quote.temporaryInsured?.cpf ||
						quote.temporaryInsured?.cnpj) as string,
					birth: (quote.insured?.birth ||
						quote.temporaryInsured?.birth) as Date,
					phone: (quote.insured?.phone ||
						quote.temporaryInsured?.phone) as string,
				},
				vehicle: {
					plate: quote.quoteVehicle?.plate,
					manufacturer: (quote.quoteVehicle?.vehicle?.manufacturer.name ||
						quote.quoteVehicle?.vehicleWithoutPlate?.manufacturer
							?.name) as string,
					model: (quote.quoteVehicle?.vehicle?.model ||
						quote.quoteVehicle?.vehicleWithoutPlate?.model) as string,
					modelYear: (quote.quoteVehicle?.vehicle?.modelYear ||
						quote.quoteVehicle?.vehicleWithoutPlate?.modelYear) as number,
					chassi: quote.quoteVehicle?.vehicle?.chassi,
					usage: quote.quoteVehicle?.usage as VehicleUsage,
					exchange: (quote.quoteVehicle?.vehicle?.exchange ||
						quote.quoteVehicle?.vehicleWithoutPlate
							?.exchange) as VehicleExchange,
					overnightPostalCode: quote.quoteVehicle
						?.overnightPostalCode as string,
				},
				driver: {
					name: quote.quoteVehicle?.driverName as string,
					cpf: quote.quoteVehicle?.driverCPF as string,
					birth: quote.quoteVehicle?.driverBirth as Date,
				},
			} as z.infer<typeof SchemaQuoteRegister>,
			200,
		);
	});
}

export { registerRoutersServicesQuotesByPlate };
