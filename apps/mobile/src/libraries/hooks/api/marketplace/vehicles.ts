import type {
	MarketplaceVehicle,
	MarketplaceVehicleRegisterForm,
	ResponseDataCursor,
	SearchParamsMarketplaceSimpleProps,
} from '@segwise/core/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { XiorError } from 'xior';
import { fetchApi } from '@/functions/api';

const useMarketplaceListining = (props: SearchParamsMarketplaceSimpleProps) =>
	useQuery<
		Awaited<ReturnType<typeof fetchApi.marketplace.listining>>,
		XiorError,
		ResponseDataCursor<MarketplaceVehicle>
	>({
		queryKey: ['marketplace', 'listining', props],
		queryFn: async () => fetchApi.marketplace.listining(props),
	});

const useMyMarketplaceVehicles = ({
	registration,
	...props
}: SearchParamsMarketplaceSimpleProps & {
	registration: string;
}) =>
	useQuery<
		Awaited<ReturnType<typeof fetchApi.marketplace.myVehicles>>,
		XiorError,
		ResponseDataCursor<MarketplaceVehicle>
	>({
		queryKey: ['marketplace', 'my-vehicles', props],
		queryFn: async () => fetchApi.marketplace.myVehicles(props, registration),
		retry: false,
	});

const useMarketplaceVehicleDelete = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.marketplace.vehicleDelete>>,
		XiorError,
		{
			id: string;
		}
	>({
		mutationKey: ['marketplace', 'my-vehicles', 'delete'],
		mutationFn: async ({ id }) => fetchApi.marketplace.vehicleDelete(id),
		async onSuccess(_data, _variables, _mutate, ctx) {
			await ctx.client.invalidateQueries({
				queryKey: ['marketplace'],
			});
		},
	});

const useMarketplaceVehicleDetail = (id?: string) =>
	useQuery<
		Awaited<ReturnType<typeof fetchApi.marketplace.details>>,
		XiorError,
		MarketplaceVehicleRegisterForm
	>({
		queryKey: ['marketplace', 'details', id],
		// @ts-expect-error
		queryFn: async () => await fetchApi.marketplace.details(id),
		enabled: !!id,
	});

const useMarketplaceVehicleEdit = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.marketplace.edit>>,
		XiorError,
		MarketplaceVehicleRegisterForm & {
			id: string;
		}
	>({
		mutationKey: ['marketplace', 'my-vehicles', 'edit'],
		mutationFn: async ({ id, ...props }) =>
			fetchApi.marketplace.edit(id, props),
		async onSuccess(_data, _variables, _mutate, ctx) {
			await ctx.client.invalidateQueries({
				queryKey: ['marketplace'],
			});
		},
	});

const useMarketplaceVehicleRegister = (client: string) =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.marketplace.register>>,
		XiorError,
		MarketplaceVehicleRegisterForm
	>({
		mutationKey: ['marketplace', 'my-vehicles', 'register'],
		mutationFn: async (props) => fetchApi.marketplace.register(props, client),
		async onSuccess(_data, _variables, _mutate, ctx) {
			await ctx.client.invalidateQueries({
				queryKey: ['marketplace'],
			});
		},
	});

export {
	useMarketplaceListining,
	useMarketplaceVehicleDelete,
	useMarketplaceVehicleDetail,
	useMarketplaceVehicleEdit,
	useMarketplaceVehicleRegister,
	useMyMarketplaceVehicles,
};
