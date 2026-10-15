import type {
	MarketplaceVehicle,
	MarketplaceVehicleRegisterForm,
	ResponseDataCursor,
	ResponseDefault,
	SearchParamsMarketplaceSimpleProps,
} from '@segwise/core/types';
import { fetch } from 'expo/fetch';
import { File as ExpoFile } from 'expo-file-system';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

async function vehicles(props: SearchParamsMarketplaceSimpleProps) {
	try {
		const { data } = await api.get<ResponseDataCursor<MarketplaceVehicle>>(
			'/marketplace',
			{
				params: props,
			},
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao consultar');
		}

		throw error;
	}
}

async function myVehicles(
	props: SearchParamsMarketplaceSimpleProps,
	client: string,
) {
	try {
		const { data } = await api.get<ResponseDataCursor<MarketplaceVehicle>>(
			'/marketplace/my-vehicles',
			{
				params: props,
				headers: {
					'Client-Registration': client,
				},
			},
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao consultar');
		}

		throw error;
	}
}

async function vehicleRegister(
	props: MarketplaceVehicleRegisterForm,
	client: string,
) {
	try {
		const formData = new FormData();

		for (const photo of props.photos) {
			formData.append(
				'photos',
				typeof photo === 'string' ? new ExpoFile(photo) : photo,
			);
		}

		formData.set('model', props.model);
		formData.set('year', props.year.toString());
		formData.set('plate', props.plate);
		formData.set('color', props.color);
		// @ts-expect-error
		formData.set('fuel', props.fuel.value);
		// @ts-expect-error
		formData.set('transmission', props.transmission.value);
		// @ts-expect-error
		formData.set('state', props.state.value);
		// @ts-expect-error
		formData.set('city', props.city.value);
		formData.set('price', props.price.toString());
		formData.set('mileage', props.mileage.toString());

		if (props.description) {
			formData.set('description', props.description);
		}

		const fetchResponse = await fetch(
			`${api.config?.baseURL}/marketplace/my-vehicles`,
			{
				method: 'POST',
				headers: {
					'Client-Registration': client,
				},
				body: formData,
			},
		);

		const data: ResponseDefault = await fetchResponse.json();

		if (!fetchResponse.ok) {
			throw new Error(data.message ?? 'Falha ao registrar o veículo');
		}

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao registrar');
		}

		throw error;
	}
}

async function vehicleDelete(id: string) {
	try {
		const { data } = await api.delete<ResponseDefault>(
			`/marketplace/my-vehicles/${id}`,
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao deletar');
		}

		throw error;
	}
}

async function vehicleDetails(id: string) {
	try {
		const { data } = await api.get<MarketplaceVehicle>(
			`/marketplace/my-vehicles/${id}`,
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao consultar');
		}

		throw error;
	}
}

async function vehicleEdit(id: string, props: MarketplaceVehicleRegisterForm) {
	try {
		const formData = new FormData();

		for (const photo of props.photos) {
			formData.append(
				'photos',
				typeof photo === 'string' ? new ExpoFile(photo) : photo,
			);
		}

		formData.set('model', props.model);
		formData.set('year', props.year.toString());
		formData.set('plate', props.plate);
		formData.set('color', props.color);
		// @ts-expect-error
		formData.set('fuel', props.fuel.value);
		// @ts-expect-error
		formData.set('transmission', props.transmission.value);
		// @ts-expect-error
		formData.set('state', props.state.value);
		// @ts-expect-error
		formData.set('city', props.city.value);
		formData.set('price', props.price.toString());
		formData.set('mileage', props.mileage.toString());

		if (props.description) {
			formData.set('description', props.description);
		}

		const fetchResponse = await fetch(
			`${api.config?.baseURL}/marketplace/my-vehicles/${id}`,
			{
				method: 'PATCH',
				body: formData,
			},
		);

		const data: ResponseDefault = await fetchResponse.json();

		if (!fetchResponse.ok) {
			throw new Error(data.message ?? 'Falha ao editar o veículo');
		}

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao editar');
		}

		throw error;
	}
}

export {
	myVehicles,
	vehicleDelete,
	vehicleDetails,
	vehicleEdit,
	vehicleRegister,
	vehicles,
};
