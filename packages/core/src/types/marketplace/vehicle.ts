import type z from 'zod';

import type {
	SchemaMarketplaceVehicle,
	SchemaMarketplaceVehicleEditForm,
	SchemaMarketplaceVehicleFuel,
	SchemaMarketplaceVehicleRegisterForm,
	SchemaMarketplaceVehicleStatus,
	SchemaMarketplaceVehicleTransmission,
} from '../../schemas/marketplace/vehicle';

type MarketplaceVehicle = z.infer<typeof SchemaMarketplaceVehicle>;

type MarketplaceVehicleRegisterForm = z.infer<
	typeof SchemaMarketplaceVehicleRegisterForm
>;

type MarketplaceVehicleEdit = z.infer<typeof SchemaMarketplaceVehicleEditForm>;

type MarketplaceVehicleFuel = z.infer<typeof SchemaMarketplaceVehicleFuel>;

type MarketplaceVehicleTransmission = z.infer<
	typeof SchemaMarketplaceVehicleTransmission
>;

type MarketplaceVehicleStatus = z.infer<typeof SchemaMarketplaceVehicleStatus>;

export type {
	MarketplaceVehicle,
	MarketplaceVehicleEdit,
	MarketplaceVehicleFuel,
	MarketplaceVehicleRegisterForm,
	MarketplaceVehicleStatus,
	MarketplaceVehicleTransmission,
};
