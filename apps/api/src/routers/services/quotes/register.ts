import { zValidator } from '@hono/zod-validator';
import { SchemaQuoteRegister } from '@segwise/core';
import { differenceInYears } from 'date-fns';
import type { Server } from '@/@types/server';

function registerRoutersServicesQuotesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaQuoteRegister), async (ctx) => {
		const { type, renewal, status, requestAt, insured, vehicle, driver } =
			ctx.req.valid('json');

		if (!vehicle) {
			throw new Error('Dados do veículo não preenchidos');
		}

		await ctx.database.$transaction(async (transaction) => {
			const temporaryInsured = await transaction.temporaryInsured.create({
				data: {
					cpf: insured.cpf,
					name: insured.name,
					birth: insured.birth,
					age: differenceInYears(new Date(), insured.birth),
					phone: insured.phone,
					maritalStatus: insured.maritalStatus,
					qualificationTime: insured.qualificationTime,
					...(insured.profession && {
						profession: insured.profession,
					}),
				},
				select: {
					id: true,
				},
			});

			await transaction.quote.create({
				data: {
					type,
					renewal,
					status,
					requestAt,
					temporaryInsured: {
						connect: {
							id: temporaryInsured.id,
						},
					},
					temporaryVehicle: {
						create: {
							plate: vehicle.plate,
							manufacturer: vehicle.manufacturer,
							model: vehicle.model,
							modelYear: vehicle.modelYear,
							chassi: vehicle.chassi,
							usage: vehicle.usage,
							exchange: vehicle.exchange,
							overnightPostalCode: vehicle.overnightPostalCode,
							residesIn: vehicle.additional.residence.type,
							garageOfTheResidence: vehicle.additional.residence.garage,
							garageAtWork: vehicle.additional.work,
							garageAtSchool: vehicle.additional.school,
							armored: vehicle.additional.armored,
							gasKit: vehicle.additional.gasKit,
							theInsuredIsTheOwner: vehicle.additional.theInsuredIsTheOwner,
							funded: vehicle.additional.funded,
							driversUnder26: vehicle.additional.driversUnder26,
							driverCPF: driver.cpf,
							driverName: driver.name,
							driverBirth: driver.birth,
							driverAge: differenceInYears(new Date(), driver.birth),
							driverPhone: driver.phone,
							temporaryInsured: {
								connect: {
									id: temporaryInsured.id,
								},
							},
						},
					},
				},
			});
		});

		return ctx.newResponse(
			JSON.stringify({
				message: 'Cadastrado com sucesso',
			}),
			204,
		);
	});
}

export { registerRoutersServicesQuotesRegister };
