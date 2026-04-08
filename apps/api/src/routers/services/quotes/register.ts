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
	subYears,
} from 'date-fns';
import z from 'zod';
import type { Server } from '@/@types/server';
import { vehicleByPlate } from '@/functions/vehicle/by-plate';
import { ModalityInsurance } from '@/generated/prisma/browser';

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
					...(insured.profession && {
						profession: insured.profession,
					}),
				},
				update: {
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
								driverPhone: driver.phone,
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
				broker,
			} = ctx.req.valid('json');

			const brokerId =
				broker ||
				((await ctx.database.broker
					.findFirst({
						orderBy: {
							id: 'asc',
						},
						select: {
							id: true,
						},
					})
					.then((response) => response?.id as string)) as string);

			try {
				let quote = null;
				let safe = null;

				await ctx.database.$transaction(async (transaction) => {
					const temporaryInsured = await transaction.temporaryInsured.create({
						data: {
							broker: {
								connect: {
									id: brokerId,
								},
							},
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
							broker: {
								connect: {
									id: brokerId,
								},
							},
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
													...(vehicle.exchange && {
														exchange: vehicle.exchange,
													}),
													...(vehicle.chassi && {
														chassi: vehicle.chassi,
													}),
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
								broker: {
									connect: {
										id: brokerId,
									},
								},
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
														...(vehicle.exchange && {
															exchange: vehicle.exchange,
														}),
														...(vehicle.chassi && {
															chassi: vehicle.chassi,
														}),
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
											requestedAt: subYears(endOfDay(expiration), 1),
										}
									: {
											expiration: endOfMonth(new Date()),
											requestedAt: subYears(endOfMonth(new Date()), 1),
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
