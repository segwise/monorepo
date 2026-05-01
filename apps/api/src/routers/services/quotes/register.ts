import { zValidator } from '@hono/zod-validator';
import { SchemaQuoteRegister } from '@segwise/core';
import {
	differenceInYears,
	isSameDay,
	setHours,
	setMilliseconds,
	setMinutes,
	setSeconds,
	startOfDay,
} from 'date-fns';
import type { Server } from '@/@types/server';

function registerRoutersServicesQuotesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaQuoteRegister), async (ctx) => {
		const brokerId = ctx.session.brokerId;

		if (!brokerId) {
			return ctx.json(
				{
					message: 'Usuários sem corretora vinculada',
				},
				401,
			);
		}

		const {
			modality,
			renewal,
			status,
			requestedAt,
			insured,
			vehicle,
			driver,
			producer,
			insuranceCompany,
			expiration,
		} = ctx.req.valid('json');

		await ctx.database.$transaction(async (transaction) => {
			const temporaryInsured = await transaction.temporaryInsured.upsert({
				where: {
					brokerId_cpf: {
						brokerId,
						cpf: insured.cpf,
					},
				},
				create: {
					broker: {
						connect: {
							id: brokerId,
						},
					},
					name: insured.name,
					birth: insured.birth,
					age: differenceInYears(new Date(), insured.birth),
					phone: insured.phone,
					maritalStatus: insured.maritalStatus,
					qualificationTime: insured.qualificationTime,
				},
				update: {
					name: insured.name,
					birth: insured.birth,
					age: differenceInYears(new Date(), insured.birth),
					phone: insured.phone,
					maritalStatus: insured.maritalStatus,
					qualificationTime: insured.qualificationTime,
				},
				select: {
					id: true,
				},
			});

			const vehicleId = vehicle?.plate
				? await transaction.vehicle
						.findFirst({
							where: {
								OR: [
									{
										plate: vehicle.plate,
									},
									{
										plateAlternative: vehicle.plate,
									},
								],
							},
							select: {
								id: true,
							},
						})
						.then((response) => response?.id)
				: null;

			const { quoteVehicle } = await transaction.quote.create({
				data: {
					broker: {
						connect: {
							id: brokerId,
						},
					},
					...(!!producer && {
						producer: {
							connect: {
								id: producer,
							},
						},
					}),
					modality,
					renewal,
					...(!!renewal &&
						!!insuranceCompany && {
							insuranceCompany: {
								connect: {
									id: insuranceCompany,
								},
							},
							expiration,
						}),
					status,
					requestedAt: isSameDay(new Date(), requestedAt)
						? setMilliseconds(
								setSeconds(
									setMinutes(
										setHours(requestedAt, new Date().getHours()),
										new Date().getMinutes(),
									),
									new Date().getSeconds(),
								),
								0,
							)
						: startOfDay(requestedAt),
					temporaryInsured: {
						connect: {
							id: temporaryInsured.id,
						},
					},
					...(vehicle && {
						quoteVehicle: {
							create: {
								plate: vehicle.plate,
								...(vehicle.plate &&
									vehicleId && {
										vehicle: {
											connect: {
												id: vehicleId,
											},
										},
									}),
								...(!vehicle.plate && {
									vehicleWithoutPlate: {
										create: {
											manufacturer: {
												connect: {
													id: vehicle.manufacturer,
												},
											},
											model: vehicle.model,
											modelYear: vehicle.modelYear,
											...(vehicle.exchange && {
												exchange: vehicle.exchange,
											}),
										},
									},
								}),
								usage: vehicle.usage,
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
							},
						},
					}),
				},
				select: {
					quoteVehicle: {
						select: {
							vehicleId: true,
							vehicleWithoutPlateId: true,
						},
					},
				},
				relationLoadStrategy: 'join',
			});

			if (quoteVehicle?.vehicleId && vehicle?.exchange) {
				await transaction.vehicle.update({
					where: {
						id: quoteVehicle.vehicleId,
					},
					data: {
						exchange: vehicle.exchange,
					},
				});
			}

			if (quoteVehicle?.vehicleWithoutPlateId && vehicle?.exchange) {
				await transaction.vehicleWithoutPlate.update({
					where: {
						id: quoteVehicle.vehicleWithoutPlateId,
					},
					data: {
						exchange: vehicle.exchange,
					},
				});
			}
		});

		return ctx.json(
			{
				message: 'Cadastrado com sucesso',
			},
			200,
		);
	});
}

export { registerRoutersServicesQuotesRegister };
