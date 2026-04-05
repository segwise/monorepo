import { zValidator } from '@hono/zod-validator';
import { calculatePercentageOfValue, SchemaSafeRegister } from '@segwise/core';
import {
	addDays,
	addMonths,
	addYears,
	differenceInYears,
	isSameDay,
	isSaturday,
	isSunday,
	setHours,
	setMinutes,
	startOfDay,
} from 'date-fns';
import type { Server } from '@/@types/server';
import { Role, StatusPayment, TypePayment } from '@/generated/prisma/enums';
import { Decimal } from '@/generated/prisma/internal/prismaNamespace';

function registerRoutersServicesSafesRegister(server: Server) {
	server.post('/', zValidator('json', SchemaSafeRegister), async (ctx) => {
		const broker = ctx.session.brokerId;

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
				.then((response) => response?.id)) as string);

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

		if (producer) {
			const response = await ctx.database.user.findUnique({
				where: {
					id: producer,
				},
				select: {
					role: true,
					members: {
						where: {
							brokerId,
						},
						select: {
							brokerId: true,
						},
					},
				},
			});

			if (!response) {
				throw new Error('Produtor não encontrado!');
			}

			if (!!broker && response.role === Role.customer) {
				if (!response.members.find((e) => e.brokerId === broker)) {
					throw new Error('Produtor não encontrado!');
				}
			}
		}

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

			const { id: safeId } = await transaction.safe.create({
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
					commissionAmount: calculatePercentageOfValue(
						receivables.award,
						receivables.commission,
					),
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
				select: {
					id: true,
				},
			});

			if (commissions && producer) {
				const isProducerSystem = await transaction.user
					.findUnique({
						where: {
							id: producer,
						},
						select: {
							role: true,
						},
					})
					.then((response) => response?.role !== Role.customer);

				const commissionSystem = 0;

				if (commissions?.type === 'fixed_value') {
					throw new Error('Tipo de comissão fixa não disponível no momento');
				}

				if (commissions.discountFixed || commissions.discountPercentage) {
					throw new Error('Desconto de pagamento não disponível no momento');
				}

				if (commissions.monthlyInterest) {
					throw new Error('Juros de pagamento não disponível no momento');
				}

				const amount = isProducerSystem
					? 100
					: new Decimal(
							commissions.type === 'by_the_brokerage_commission'
								? calculatePercentageOfValue(
										calculatePercentageOfValue(
											receivables.award,
											receivables.commission,
										),
										commissions.percentage,
									)
								: commissions.type === 'by_the_net_premium'
									? calculatePercentageOfValue(
											receivables.award,
											commissions.percentage,
										)
									: 0,
						).div(commissions.installments);

				if (
					isSaturday(commissions.paymentDate) ||
					isSunday(commissions.paymentDate)
				) {
					throw new Error(
						'Data de pagamento de comissão não pode ser final de semana',
					);
				}

				const paymentPrimaryId = Bun.randomUUIDv7();

				for (let i = 0; i < commissions.installments; i++) {
					let dueDate = addMonths(commissions.paymentDate, i);

					dueDate = startOfDay(dueDate);

					if (isSaturday(dueDate) || isSunday(dueDate)) {
						dueDate = addDays(dueDate, isSaturday(dueDate) ? 2 : 1);
					}

					await transaction.payment.create({
						data: {
							type: TypePayment.commission,
							...(i === 0 && {
								id: paymentPrimaryId,
							}),
							...(!isProducerSystem && {
								payer: {
									connectOrCreate: {
										where: { id: brokerId },
										create: { id: brokerId },
									},
								},
							}),
							receiver: {
								connectOrCreate: {
									where: { id: producer },
									create: { id: producer },
								},
							},
							bridge: {
								connectOrCreate: {
									where: { id: safeId },
									create: { id: safeId },
								},
							},
							installment: i + 1,
							amount,
							expiration: dueDate,
							status: StatusPayment.waiting,
							...(paymentPrimaryId &&
								i > 0 && {
									relatedPayment: {
										connect: {
											id: paymentPrimaryId,
										},
									},
								}),
						},
					});
				}
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

export { registerRoutersServicesSafesRegister };
