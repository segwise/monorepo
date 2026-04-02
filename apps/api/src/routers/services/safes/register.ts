import { zValidator } from '@hono/zod-validator';
import { SchemaSafeRegister } from '@segwise/core';
import {
	addYears,
	differenceInYears,
	isSameDay,
	setHours,
	setMinutes,
	startOfDay,
} from 'date-fns';
import type { Server } from '@/@types/server';

function registerRoutersServicesSafesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaSafeRegister), async (ctx) => {
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
			receivables,
			commissions,
		} = ctx.req.valid('json');

		await ctx.database.$transaction(async (transaction) => {
			const isInsured = await transaction.insured.findFirst({
				where: {
					cpf: insured.cpf,
				},
				select: {
					id: true,
				},
			});

			let insuredConfirmId: string | null = isInsured?.id || null;

			if (!isInsured) {
				insuredConfirmId = await transaction.insured
					.create({
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
					})
					.then((response) => response.id);
			} else {
				await transaction.insured.update({
					where: {
						id: insuredConfirmId as string,
					},
					data: {
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
			}

			const requestedAtUpdate = isSameDay(new Date(), requestedAt)
				? setMinutes(
						setHours(startOfDay(requestedAt), new Date().getHours()),
						new Date().getMinutes(),
					)
				: startOfDay(requestedAt);

			await transaction.safe.create({
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
					insuranceCompany: {
						connect: {
							id: insuranceCompany,
						},
					},
					status,
					expiration: addYears(requestedAtUpdate, 1),
					requestedAt: requestedAtUpdate,
					insured: {
						connect: {
							id: insuredConfirmId as string,
						},
					},
					...(vehicle && {
						safeVehicle: {
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
								driverCPF: driver.cpf,
								driverName: driver.name,
								driverBirth: driver.birth,
								driverAge: differenceInYears(new Date(), driver.birth),
								driverPhone: driver.phone,
							},
						},
					}),
					installments: receivables.installments,
					award: receivables.award,
					franchise: receivables.franchise,
					commission: receivables.commission,
					...(commissions && {
						commissionOfType: commissions.type,
						commissionPercentage: commissions.percentage,
						...(commissions.discountPercentage && {
							commissionDiscountPercentage: commissions.discountPercentage,
						}),
						...(commissions.discountFixed && {
							commissionDiscountFixed: commissions.discountFixed,
						}),
						commissionInstallments: commissions.installments,
						commissionMonthlyInterest: commissions.monthlyInterest,
						commissionPayInterestStarting: commissions.payInterestStarting,
						commissionTypeOfInterest: commissions.typeOfInterest,
						commissionPaymentDate: commissions.paymentDate,
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
}

export { registerRoutersServicesSafesRegister };
