import type {
	EndorsementAddress,
	EndorsementCancel,
	EndorsementFranchise,
	EndorsementSimple,
	EndorsementVehicleConductor,
} from '@segwise/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { compareDesc } from 'date-fns';
import { XiorError } from 'xior';
import { api } from '../api';

const useEndorsements = (id: string, enabled?: boolean) =>
	useQuery({
		queryKey: ['endorsements', id],
		queryFn: async ({ signal }) => {
			const { data } = await api.get<Array<EndorsementSimple>>(
				`/endorsements/${id}`,
				{
					signal,
				},
			);

			// Do mais recente para o mais antigo REGISTRADO: é a ordem em que os
			// endossos podem ser revertidos (só o primeiro ainda não revertido).
			return data?.sort((a, b) => compareDesc(a.createdAt, b.createdAt));
		},
		enabled,
	});

// Reverte um endosso (até 24h, só o mais recente não revertido; as regras valem no
// servidor). O endosso continua na lista, marcado como revertido.
const useEndorsementRevert = (safeId: string) =>
	useMutation<{ message: string }, Error, string>({
		mutationKey: ['endorsements', safeId, 'revert'],
		mutationFn: async (endorsementId) => {
			try {
				const { data } = await api.post(
					`/endorsements/${safeId}/${endorsementId}/revert`,
				);

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(
						error.response?.data.message ?? 'Falha ao reverter o endosso',
					);
				}

				throw error;
			}
		},
		async onSuccess(_data, _variables, _result, { client }) {
			await Promise.all([
				client.invalidateQueries({ queryKey: ['endorsements', safeId] }),
				client.invalidateQueries({ queryKey: ['proposals'] }),
				client.invalidateQueries({ queryKey: ['safe', safeId] }),
			]);
		},
	});

const useEndorsementPercentage = (
	id: string,
	{
		enabled = true,
	}: {
		enabled: boolean;
	},
) =>
	useQuery({
		queryKey: ['endorsement', id, 'percentage'],
		queryFn: async ({ signal }) => {
			try {
				const { data } = await api.get<{
					percentage: number;
				}>(`/endorsements/${id}/percentage`, {
					signal,
				});

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		enabled: enabled && !!id,
	});

const useEndorsementVehicleConductor = () =>
	useMutation<
		{
			message: string;
		},
		Error,
		EndorsementVehicleConductor & {
			id: string;
		}
	>({
		mutationKey: ['endorsements', 'vehicle-conductor'],
		mutationFn: async ({
			id,
			plate,
			model,
			modelYear,
			driver,
			amount,
			percentage,
			franchise,
		}) => {
			try {
				const { data } = await api.post(
					`/endorsements/${id}/vehicle-conductor`,
					{
						plate,
						model,
						modelYear,
						amount,
						percentage,
						driver,
						franchise,
					},
				);

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		onSuccess(_, variables, ___, { client }) {
			const { id } = variables;

			Promise.all([
				client.resetQueries({
					queryKey: ['endorsements', id],
				}),
				client.refetchQueries({
					queryKey: ['proposals', 'simple'],
				}),
			]);
		},
	});

const useEndorsementVehicleConductorQuery = (
	id: string,
	enabled: boolean = true,
) =>
	useQuery({
		queryKey: ['endorsements', id, 'vehicle-conductor'],
		queryFn: async ({ signal }) => {
			try {
				const { data } = await api.get<{
					vehicle: {
						plate?: string;
						model: string;
						modelYear: number;
					};
					driver: {
						cpf: string;
						name: string;
					};
				}>(`/endorsements/${id}/vehicle-conductor`, {
					signal,
				});

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		enabled,
	});

const useEndorsementAddress = () =>
	useMutation<
		{
			message: string;
		},
		Error,
		EndorsementAddress & {
			id: string;
		}
	>({
		mutationKey: ['endorsements', 'address'],
		mutationFn: async ({ id, postalCode, amount, percentage }) => {
			try {
				const { data } = await api.post(`/endorsements/${id}/address`, {
					postalCode,
					amount,
					percentage,
				});

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		onSuccess(_, variables, ___, { client }) {
			const { id } = variables;

			client.resetQueries({
				queryKey: ['endorsements', id],
			});
		},
	});

const useEndorsementFranchise = () =>
	useMutation<
		{
			message: string;
		},
		Error,
		EndorsementFranchise & {
			id: string;
		}
	>({
		mutationKey: ['endorsements', 'franchise'],
		mutationFn: async ({ id, franchise, amount, percentage }) => {
			try {
				const { data } = await api.post(`/endorsements/${id}/franchise`, {
					franchise,
					amount,
					percentage,
				});

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		onSuccess(_, variables, ___, { client }) {
			const { id } = variables;

			client.resetQueries({
				queryKey: ['endorsements', id],
			});
		},
	});

const useEndorsementCancel = () =>
	useMutation<
		{
			message: string;
		},
		Error,
		EndorsementCancel & {
			id: string;
		}
	>({
		mutationKey: ['endorsements', 'cancel'],
		mutationFn: async ({ id, effectivedAt }) => {
			try {
				const { data } = await api.post(`/endorsements/${id}/cancel`, {
					effectivedAt,
				});

				return data;
			} catch (error) {
				if (error instanceof XiorError) {
					throw new Error(error.response?.data.message);
				}

				throw error;
			}
		},
		onSuccess(_, variables, ___, { client }) {
			const { id } = variables;

			client.resetQueries({
				queryKey: ['endorsements', id],
			});
		},
	});

export {
	useEndorsementAddress,
	useEndorsementCancel,
	useEndorsementFranchise,
	useEndorsementPercentage,
	useEndorsementRevert,
	useEndorsements,
	useEndorsementVehicleConductor,
	useEndorsementVehicleConductorQuery,
};
