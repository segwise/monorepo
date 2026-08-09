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

			return data?.sort((a, b) =>
				compareDesc(
					a.effectivedAt ?? a.createdAt,
					b.effectivedAt ?? b.createdAt,
				),
			);
		},
		enabled,
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
					queryKey: ['policies', 'simple'],
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
		queryKey: ['endorsements', 'vehicle-conductor'],
		queryFn: async () => {
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
				}>(`/endorsements/${id}/vehicle-conductor`);

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
	useEndorsements,
	useEndorsementVehicleConductorQuery,
	useEndorsementVehicleConductor,
	useEndorsementAddress,
	useEndorsementFranchise,
	useEndorsementCancel,
};
