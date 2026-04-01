import { zValidator } from '@hono/zod-validator';
import { SchemaQuoteRegister, SchemaQuoteSimpleRegister } from '@segwise/core';
import {
	differenceInYears,
	endOfDay,
	endOfMonth,
	isSameDay,
	setHours,
	setMilliseconds,
	setMinutes,
	setSeconds,
	startOfDay,
} from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { vehicleByPlate } from '@/functions/vehicle/by-plate';
import { ModalityInsurance } from '@/generated/prisma/browser';

function registerRoutersServicesQuotesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaQuoteRegister), async (ctx) => {
		const {
			modality,
			renewal,
			status,
			requestedAt,
			insured,
			vehicle,
			driver,
			producer,
		} = ctx.req.valid('json');

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
					...(!!producer && {
						producer: {
							connect: {
								id: producer,
							},
						},
					}),
					modality,
					renewal,
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
								...(vehicle.plate && {
									vehicle: {
										connectOrCreate: {
											where: {
												plate: vehicle.plate,
											},
											create: {
												plate: vehicle.plate,
												plateAlternative: vehicle.plate,
												manufacturer: {
													connect: {
														id: vehicle.manufacturer,
													},
												},
												model: vehicle.model,
												modelYear: vehicle.modelYear,
												exchange: vehicle.exchange,
												chassi: vehicle.chassi,
											},
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
											exchange: vehicle.exchange,
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
								driverPhone: driver.phone,
							},
						},
					}),
				},
			});
		});

		return ctx.json(
			{
				message: 'Cadastrado com sucesso',
			},
			200,
		);
	});

	server.post(
		'/simple',
		zValidator('json', SchemaQuoteSimpleRegister),
		zValidator(
			'query',
			z.object({
				asResponse: z
					.boolean()
					.or(
						z.literal(['true', 'false']).transform((value) => value === 'true'),
					)
					.nullish(),
			}),
		),
		async (ctx) => {
			const { asResponse } = ctx.req.valid('query');

			const {
				modality,
				renewal,
				association,
				insured,
				plate,
				usage,
				postalCode,
				insuranceCompany,
				expiration,
				franchise,
			} = ctx.req.valid('json');

			try {
				let quote = null;
				let safe = null;

				await ctx.database.$transaction(async (transaction) => {
					const temporaryInsured = await transaction.temporaryInsured.create({
						data: {
							name: insured.name,
							phone: insured.phone,
						},
						select: {
							id: true,
						},
					});

					const vehicle = plate ? await vehicleByPlate(plate) : null;

					if (plate && !vehicle) {
						throw new Error('Falha ao consultar dados do veículo');
					}

					const response = await transaction.quote.create({
						data: {
							modality,
							...(!!renewal && {
								renewal,
							}),
							...(!!association && {
								association,
							}),
							temporaryInsured: {
								connect: {
									id: temporaryInsured.id,
								},
							},
							quoteVehicle: {
								create: {
									...(!!vehicle && {
										vehicle: {
											connectOrCreate: {
												where: {
													id: vehicle.id,
												},
												create: {
													plate: vehicle.plate,
													plateAlternative: vehicle.plate,
													manufacturer: {
														connect: {
															id: vehicle.manufacturer.id,
														},
													},
													model: vehicle.model,
													modelYear: vehicle.modelYear,
													exchange: vehicle.exchange,
													chassi: vehicle.chassi,
												},
											},
										},
									}),
									...(!vehicle && {
										vehicleWithoutPlate: {
											create: {},
										},
									}),
									usage,
									overnightPostalCode: postalCode,
								},
							},
							...(insuranceCompany && {
								insuranceCompany: {
									connect: {
										id: insuranceCompany,
									},
								},
							}),
							...(expiration && {
								expiration,
							}),
							franchise,
						},
						select: {
							id: true,
						},
						relationLoadStrategy: 'join',
					});

					quote = response.id;

					if (renewal) {
						const response = await transaction.safe.create({
							data: {
								isExternal: true,
								temporaryInsured: {
									connect: {
										id: temporaryInsured.id,
									},
								},
								modality: ModalityInsurance.car,
								...(!!insuranceCompany && {
									insuranceCompany: {
										connect: {
											id: insuranceCompany,
										},
									},
								}),
								safeVehicle: {
									create: {
										...(!!vehicle && {
											vehicle: {
												connectOrCreate: {
													where: {
														id: vehicle.id,
													},
													create: {
														plate: vehicle.plate,
														plateAlternative: vehicle.plate,
														manufacturer: {
															connect: {
																id: vehicle.manufacturer.id,
															},
														},
														model: vehicle.model,
														modelYear: vehicle.modelYear,
														exchange: vehicle.exchange,
														chassi: vehicle.chassi,
													},
												},
											},
										}),
										...(!vehicle && {
											vehicleWithoutPlate: {
												create: {},
											},
										}),
										usage,
										overnightPostalCode: postalCode,
									},
								},
								...(expiration
									? {
											expiration: endOfDay(expiration),
										}
									: {
											expiration: endOfMonth(new Date()),
										}),
								franchise,
							},
							select: {
								id: true,
							},
							relationLoadStrategy: 'join',
						});

						safe = response.id;
					}
				});

				return ctx.json(
					!asResponse
						? {
								message: 'Cadastrado com sucesso',
							}
						: !safe
							? {
									quote,
								}
							: {
									quote,
									safe,
								},
					200,
				);
			} catch (error) {
				let message = 'Falha ao registrar';

				if (error instanceof Error) {
					message = error.message;
				}

				return ctx.json(
					{
						message,
					},
					500,
				);
			}
		},
	);
}

export { registerRoutersServicesQuotesRegister };
