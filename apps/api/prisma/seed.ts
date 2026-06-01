import { faker } from '@faker-js/faker/locale/pt_BR';
import {
	SchemaMarketplaceVehicleConservations,
	SchemaMarketplaceVehicleFeatures,
} from '@segwise/core';
import { generateReferral } from '@segwise/core/utils';
import type { User } from 'better-auth';
import {
	addDays,
	endOfDay,
	endOfYear,
	subDays,
	subHours,
	subYears,
} from 'date-fns';
import xior from 'xior';
import {
	MarketplaceVehicleAcceptExchangeAmount,
	MarketplaceVehicleDirection,
	MarketplaceVehicleFinancialState,
	MarketplaceVehicleFuel,
	MarketplaceVehicleStatus,
	MarketplaceVehicleTransmission,
	MarketplaceVehicleType,
	ModalityInsurance,
	Role,
	StatusQuote,
	StatusSafe,
	VehicleUsage,
} from '@/generated/prisma/enums';
import { environment } from '@/libraries/environment';
import { auth } from '@/services/auth';
import { database } from '@/services/database';
import { storage } from '@/services/storage/images';

type AuthProfile = {
	name: string;
	email: string;
	password: string;
};

const INIT: AuthProfile = {
	name: 'Administrador Master',
	email: 'admin@segwise.com.br',
	password: 'Segwise123!',
};

const OWNER_BROKER: AuthProfile =
	environment.NODE_ENV === 'production'
		? {
				name: 'Fernando Sena',
				email: 'fernando.sena_@hotmail.com',
				password: '248827Bac',
			}
		: {
				name: 'Junior Melo',
				email: 'contato@juniormelo.com',
				password: 'Jr271101!',
			};

const PRODUCER_BROKER: AuthProfile | null = null;

const insuranceCompaniesSeed = [
	{
		name: 'aig seguros brasil s/a',
		short_name: 'aig',
		registration: '33040981000150',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/3bf7a588-36b1-4a2c-bd80-0a4541fb58a6/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08005911465',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007240149',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007240219',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007266130',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'alfa seguradora s/a',
		short_name: 'alfa',
		registration: '02713529000188',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/806dc0f0-6216-49af-9fa7-22de41931e22/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '551143931567',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40032532',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08008882532',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007705244',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007742352',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007742532',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'allianz seguros s/a',
		short_name: 'allianz',
		registration: '61573796000166',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/6b588296-0484-49b3-b1a3-56300e54495a/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '551140901444',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40901110',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08000130700',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '0800121239',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08007011170',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007713313',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '0800115215',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'aruana seguradora s/a',
		short_name: 'aruana',
		registration: '07017295000158',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/5f5f67e2-58f0-4d2a-a174-933cee7f259a/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08007464626',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007220889',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007031989',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08000330302',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'azul companhia de seguros gerais',
		short_name: 'azul',
		registration: '33448150000111',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/464ed884-ef62-4697-82bd-487b520272a3/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '552139062985',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40043700',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007030203',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007278736',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007271184',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007031280',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'banestes seguros s/a',
		short_name: 'banestes',
		registration: '27053230000175',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/9be0a96f-1489-4c09-b409-51e502313097/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '08007031450',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08002823030',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08002811515',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007270030',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007270474',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'bb seguros participacoes s/a',
		short_name: 'bb seguros',
		registration: '11159426000109',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/37a92a07-ab17-4b88-b071-2443aaaf7841/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '551140047000',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '08007297000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007755045',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08005707042',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007297000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'contratações, renovações e alteração na apólice',
				contacts: [
					{
						value: '08007290400',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'bradesco seguros s/a',
		short_name: 'bradesco seguros',
		registration: '33055146000193',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/e1c48eab-be8e-4c9a-8034-15a56486d542/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '552140042702',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40042757',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007012757',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007012762',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007017000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007279966',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'caixa seguradora s/a',
		short_name: 'caixa seguradora',
		registration: '34020354000110',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/1d87fcce-c431-48aa-b9c5-07d843893761/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '556121922020',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '08007024000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007024260',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007024240',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007024280',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'contratações, renovações e alteração na apólice',
				contacts: [
					{
						value: '08007024000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'chubb seguros brasil s/a',
		short_name: 'chubb',
		registration: '03502099000118',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/59ed9068-bfd6-4c6f-b3bb-7f056dcfeda7/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '30034363',
						whatsapp: null,
						region: 'all_regions',
					},
					{
						value: '08007025048',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007225112',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08007036665',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007225059',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007728550',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'darwin seguros s a',
		short_name: 'darwin seguros',
		registration: '44187990000194',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/996bdaec-5717-441c-9a16-e59ab417ebb1/logo',
		created_at: '2023-12-20T17:36:48.733Z',
		assistance_contacts: [
			{
				description: 'assistência 24h / vidros / sinistro',
				contacts: [
					{
						value: '551135127210',
						whatsapp: true,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08002371360',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
				],
			},
		],
	},
	{
		name: 'ezze seguros s/a',
		short_name: 'ezze seguros',
		registration: '31534848000124',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/77bfb521-a940-4ebb-98e4-0d2ef86ce09e/logo',
		created_at: '2024-11-11T00:14:36.470Z',
		assistance_contacts: [],
	},
	{
		name: 'generali brasil seguros s/a',
		short_name: 'generali',
		registration: '33072307000157',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/f85f4b1e-6dff-4c3f-8717-13662bef19c6/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '5521992168814',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '30045858',
						whatsapp: null,
						region: 'all_regions',
					},
					{
						value: '08007070211',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08008890400',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08002804747',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08008803900',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08008890200',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'hdi seguros s/a',
		short_name: 'hdi',
		registration: '29980158000157',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/8a8be33d-5e2b-4957-a4b3-bab732bdb751/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08007701608',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '30035390',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08004344340',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007721825',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007754035',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007227149',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'indiana seguros s/a',
		short_name: 'indiana',
		registration: '61100145000159',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/43b80b4e-379c-4390-82f9-1f9cefc97ac0/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08007042567',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007219104',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007404994',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007261981',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'itaú seguros s/a',
		short_name: 'itaú seguros',
		registration: '61557039000107',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/9df4e00c-2c12-448a-94a7-50949f6854eb/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '5511983559577',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '30031010',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007201010',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007221722',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08005700011',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007280728',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'mapfre seguros gerais s/a',
		short_name: 'mapfre',
		registration: '61074175000138',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/a1df4caf-0bc6-4494-b3ce-1e06619e0b7f/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '551140040101',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40040101',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007754545',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007755045',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007753240',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007754545',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'mitsui sumitomo seguros s/a',
		short_name: 'mitsui sumitomo',
		registration: '33016221000107',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/c9d45441-d4be-4338-ac6a-d2787d8555ad/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '551131775700',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '03007726744',
						whatsapp: null,
						region: 'all_regions',
					},
					{
						value: '08007077883',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007613004',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08007077818',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08008886744',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007736744',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'porto seguro cia de seguros gerais',
		short_name: 'porto seguro',
		registration: '61198164000160',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/79c00f92-05e3-4569-8ad8-f3f31b24fbe8/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '551130039303',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '400476786',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007270800',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007278736',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007271184',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007272766',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'sancor seguros do brasil s/a',
		short_name: 'sancor',
		registration: '17643407000130',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/c97a1e5c-4036-4f7e-919a-a274d47a6fd4/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08002020003',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40030393',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '40030395',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08002000393',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08008880399',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08008880402',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08002000392',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'santander s.a. serviços técnicos, administrativos e de corretagem de seguros',
		short_name: 'santander seguros',
		registration: '52312907000190',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/4596e171-fae1-44db-bb58-7fc01252228a/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '40043535',
						whatsapp: null,
						region: 'all_regions',
					},
					{
						value: '08002019002',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08002021333',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08002019002',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08002019600',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'sompo seguros s/a',
		short_name: 'sompo',
		registration: '61383493000180',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/6724945c-ede7-49e2-ba84-ac001b57040d/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '551131562990',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '08007719119',
						whatsapp: null,
						region: 'all_regions',
					},
					{
						value: '08000162727',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007719759',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007732527',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007719719',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'suhai seguradora s/a',
		short_name: 'suhai',
		registration: '16825255000123',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/46897db3-6955-49d4-8d26-d4ce4ece20c0/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / roubo / furto',
				contacts: [
					{
						value: '551130030335',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '30030335',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08003278424',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007721214',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'tokio marine seguradora s/a',
		short_name: 'tokio marine',
		registration: '33164021000100',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/e296ba94-0eb6-49ac-a4e2-2469b4b4a16b/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'vidros',
				contacts: [
					{
						value: '08007078005',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007039000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08004490000',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '5511995786546',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '08003186546',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'usebens seguros s/a',
		short_name: 'usebens',
		registration: '09180505000150',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/eb992f8c-d93d-4f94-bf46-88c485b53e7c/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '08007772003',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '0800200331',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08002004400',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007278525',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'yelum seguros',
		short_name: 'yelum',
		registration: '61550141000172',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/b0e841bb-7355-4f37-aed6-88fc60e5d25c/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '551131321001',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40045423',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007095423',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007219104',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08007014120',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007403994',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007261981',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'youse seguradora s/a',
		short_name: 'youse',
		registration: '24856160000103',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/5ea5573a-2697-4a28-bfc4-26017a1e48aa/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '30035770',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007309901',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08007309904',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007309991',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08007309903',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'zurich brasil seguros s/a',
		short_name: 'zurich',
		registration: '61382735000111',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/85c0bec0-5e29-4e92-918e-38391acac4e2/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '08007025577',
						whatsapp: true,
						region: 'all_regions',
					},
					{
						value: '40204848',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007291400',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'deficientes auditivos',
				contacts: [
					{
						value: '08002758585',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '08000256303',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08007701061',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08002484848',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'justos seguros s/a',
		image:
			'https://raichu-uploads.s3.amazonaws.com/logo_novo-seguros_YPrk8n.png',
		short_name: 'justos',
		registration: '45865343000157',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro / vidros',
				contacts: [
					{
						value: '30035770',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007309901',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'whatsapp',
				contacts: [
					{
						value: '551154686735',
						whatsapp: true,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08005912259',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		name: 'novo seguros s/a',
		image:
			'https://velseg.com.br/wp-content/uploads/2025/09/seguradora-parceira-velseg-justos-1.jpg',
		short_name: 'novo seguros',
		registration: '50182327000108',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'guincho / sinistro',
				contacts: [
					{
						value: '08000276131',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros / pequenos reparos',
				contacts: [
					{
						value: '08007772173',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'whatsapp',
				contacts: [
					{
						value: '5527999100328',
						whatsapp: true,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'ouvidoria',
				contacts: [
					{
						value: '08000276131',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08000276131',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
];

async function seed() {
	try {
		const isInit = await database.user.findUnique({
			where: {
				email: INIT.email,
			},
			select: {
				id: true,
			},
		});

		if (isInit) {
			return;
		}

		await auth.api.createUser({
			body: {
				name: INIT.name,
				email: INIT.email,
				password: INIT.password,
				role: Role.admin,
				data: {
					emailVerified: true,
				},
			},
		});

		for (const insurance of insuranceCompaniesSeed) {
			const idInsurance = Bun.randomUUIDv7();

			const pathInsurance: string = `/insurance-companies/${idInsurance}`;

			const { data } = await xior
				.get(insurance.image, {
					responseType: 'blob',
				})
				.catch(() => ({
					data: 'error',
				}));

			await storage.write(pathInsurance as string, data);

			const company = await database.insuranceCompany.create({
				data: {
					id: idInsurance,
					name: insurance.name,
					icon: pathInsurance,
					cnpj: insurance.registration,
				},
				select: {
					id: true,
				},
			});

			let categoryInt = 0;

			for (const item of insurance.assistance_contacts) {
				const category = await database.insuranceCompanyCategoryContact.create({
					data: {
						index: categoryInt++,
						label: item.description,
						insuranceCompany: {
							connect: {
								id: company.id,
							},
						},
					},
					select: {
						id: true,
					},
				});

				const contacts = insurance.assistance_contacts
					.filter((e) => e.description === item.description)
					.map((e) => e.contacts);

				for (const group of contacts) {
					let categoryContactInt = 0;

					for (const { region, whatsapp, value } of group) {
						await database.insuranceCompanyContact.create({
							data: {
								index: categoryContactInt++,
								coverage:
									region === 'all_regions'
										? 'all_regions'
										: 'capitals_and_metropolitan_regions',
								isWhatsapp: !!whatsapp,
								value,
								category: {
									connect: {
										id: category.id,
									},
								},
							},
						});
					}
				}
			}
		}

		const adminBroker = await auth.api.createUser({
			body: {
				name: OWNER_BROKER.name,
				email: OWNER_BROKER.email,
				password: OWNER_BROKER.password,
				// @ts-expect-error
				role: Role.customer,
				data: {
					emailVerified: true,
				},
			},
			returnHeaders: true,
		});

		const broker = await auth.api.createOrganization({
			body: {
				name: 'XCar Corretora de Seguros LTDA',
				slug: 'xcarcorretora',
				fantasy: 'xcar corretora',
				cnpj: '07581995000170',
				userId: adminBroker.response.user.id,
				keepCurrentActiveOrganization: true,
			},
		});

		if (environment.NODE_ENV !== 'production') {
			await database.manufacturerVehicle.createMany({
				data: Array.from({ length: 10 }).map(() => ({
					name: faker.vehicle.manufacturer(),
				})),
			});

			const [insuranceCompanies, manufacturers] = await database.$transaction([
				database.insuranceCompany.findMany({
					select: {
						id: true,
					},
				}),
				database.manufacturerVehicle.findMany({
					select: {
						id: true,
					},
				}),
			]);

			if (PRODUCER_BROKER) {
				const producerResponse = await auth.api
					.createUser({
						body: {
							name: PRODUCER_BROKER.name,
							email: PRODUCER_BROKER.email,
							password: PRODUCER_BROKER.password,
							// @ts-expect-error
							role: Role.customer,
							data: {
								emailVerified: true,
							},
						},
						asResponse: true,
					})
					.then(async (response) => (await response.json()) as { user: User });

				await auth.api.addMember({
					body: {
						userId: producerResponse.user.id,
						role: Role.producer,
						organizationId: broker.id,
						referral: generateReferral(),
					},
				});
			}

			for (let i = 0; i < 10; i++) {
				const id = Bun.randomUUIDv7();

				const image = faker.helpers.arrayElement([null, faker.image.avatar()]);

				let pathImage: string | null = image ? `/users/${id}` : null;

				if (pathImage && image) {
					const { data } = await xior
						.get(image, {
							responseType: 'blob',
						})
						.catch(() => ({
							data: 'error',
						}));

					if (data !== 'error') {
						await storage.write(pathImage, data);
					}

					if (data === 'error') {
						pathImage = null;
					}
				}

				const producerResponse = await auth.api
					.createUser({
						body: {
							name: faker.person.fullName(),
							email: faker.internet.email(),
							// @ts-expect-error
							role: Role.customer,
							data: {
								id,
								...(pathImage && {
									image: pathImage,
								}),
								emailVerified: true,
							},
						},
						asResponse: true,
					})
					.then(async (response) => (await response.json()) as { user: User });

				await auth.api.addMember({
					body: {
						userId: producerResponse.user.id,
						role: Role.producer,
						organizationId: broker.id,
						referral: generateReferral(),
					},
				});
			}

			const producers = await database.user.findMany({
				where: {
					role: Role.customer,
					members: {
						some: {
							role: Role.producer,
						},
					},
				},
				select: {
					id: true,
				},
			});

			for (let i = 0; i < 500; i++) {
				const renewal = faker.datatype.boolean();

				const status = faker.helpers.enumValue(StatusQuote);

				const isPlate = faker.datatype.boolean();

				const producer = faker.datatype.boolean()
					? null
					: faker.helpers.arrayElement(producers);

				await database.quote.create({
					data: {
						broker: {
							connect: {
								id: broker.id,
							},
						},
						...(!!producer && {
							producer: {
								connect: {
									id: producer.id,
								},
							},
						}),
						...(!!renewal && {
							insuranceCompany: {
								connect: {
									id: insuranceCompanies[
										faker.number.int({
											min: 0,
											max: insuranceCompanies.length - 1 || 0,
										})
									]?.id as string,
								},
							},
							expiration: addDays(
								new Date(),
								faker.number.int({ min: 1, max: 100 }),
							),
							franchise: faker.helpers.arrayElement([
								undefined,
								faker.number.int({ min: 1_000, max: 5_000 }),
							]),
						}),
						temporaryInsured: {
							create: {
								broker: {
									connect: {
										id: broker.id,
									},
								},
								name: faker.person.fullName(),
								phone: faker.phone.number({ style: 'international' }).slice(1),
							},
						},
						modality: faker.helpers.enumValue(ModalityInsurance),
						quoteVehicle: {
							create: {
								usage: faker.helpers.enumValue(VehicleUsage),
								overnightPostalCode: faker.location.zipCode('########'),
								...(!!isPlate && {
									vehicle: {
										create: {
											plate: faker.vehicle.vrm(),
											plateAlternative: faker.vehicle.vrm(),
											model: faker.vehicle.model(),
											modelYear: faker.date
												.between({
													from: subYears(
														new Date(),
														faker.number.int({ min: 0, max: 7 }),
													),
													to: endOfYear(endOfDay(new Date())),
												})
												.getFullYear(),
											manufacturer: {
												connect: {
													id: manufacturers[
														faker.number.int({
															min: 0,
															max: manufacturers.length - 1,
														})
													]?.id as string,
												},
											},
										},
									},
								}),
								...(!isPlate && {
									vehicleWithoutPlate: {
										create: {},
									},
								}),
							},
						},
						renewal,
						requestedAt: subHours(
							new Date(),
							faker.number.int({ min: 30, max: 10000 }),
						),
						status,
						statusAt: subHours(
							new Date(),
							faker.number.int({ min: 30, max: 10000 }),
						),
						...(status === 'recused' && {
							statusMessage: faker.lorem.lines(1),
						}),
					},
				});
			}

			for (let i = 0; i < 500; i++) {
				const renewal = faker.datatype.boolean();

				const status = faker.helpers.enumValue(StatusSafe);

				const isPlate = faker.datatype.boolean();

				const previousSafe = faker.datatype.boolean()
					? null
					: renewal
						? await database.safe.findFirst({
								select: {
									id: true,
								},
								orderBy: {
									createdAt: 'asc',
								},
							})
						: null;

				const producer = faker.datatype.boolean()
					? null
					: faker.helpers.arrayElement(producers);

				const effectivedAt = faker.datatype.boolean()
					? subHours(
							addDays(new Date(), faker.number.int({ min: 0, max: 5 })),
							faker.number.int({ min: 30, max: 10000 }),
						)
					: null;

				await database.safe.create({
					data: {
						broker: {
							connect: {
								id: broker.id,
							},
						},
						...(!!producer && {
							producer: {
								connect: {
									id: producer.id,
								},
							},
						}),
						renewal,
						...(!!renewal &&
							!!previousSafe && {
								previousSafe: {
									connect: {
										id: previousSafe.id,
									},
								},
							}),
						expiration: addDays(
							new Date(),
							faker.number.int({ min: 1, max: 100 }),
						),
						insuranceCompany: {
							connect: {
								id: insuranceCompanies[
									faker.number.int({
										min: 0,
										max: insuranceCompanies.length - 1 || 0,
									})
								]?.id as string,
							},
						},
						franchise: faker.helpers.arrayElement([
							undefined,
							faker.number.int({ min: 1_000, max: 5_000 }),
						]),
						temporaryInsured: {
							create: {
								broker: {
									connect: {
										id: broker.id,
									},
								},
								name: faker.person.fullName(),
								phone: faker.phone.number({ style: 'international' }).slice(1),
							},
						},
						modality: faker.helpers.enumValue(ModalityInsurance),
						safeVehicle: {
							create: {
								usage: faker.helpers.enumValue(VehicleUsage),
								overnightPostalCode: faker.location.zipCode('########'),
								...(!!isPlate && {
									vehicle: {
										create: {
											plate: faker.vehicle.vrm(),
											plateAlternative: faker.vehicle.vrm(),
											model: faker.vehicle.model(),
											modelYear: faker.date
												.between({
													from: subYears(
														new Date(),
														faker.number.int({ min: 0, max: 7 }),
													),
													to: endOfYear(endOfDay(new Date())),
												})
												.getFullYear(),
											manufacturer: {
												connect: {
													id: manufacturers[
														faker.number.int({
															min: 0,
															max: manufacturers.length - 1,
														})
													]?.id as string,
												},
											},
										},
									},
								}),
								...(!isPlate && {
									vehicleWithoutPlate: {
										create: {},
									},
								}),
							},
						},
						requestedAt: effectivedAt
							? subDays(effectivedAt, faker.number.int({ min: 1, max: 7 }))
							: subDays(
									subDays(new Date(), faker.number.int({ min: 0, max: 5 })),
									faker.number.int({ min: 1, max: 7 }),
								),
						...(!!effectivedAt && {
							effectivedAt,
						}),
						status,
						statusAt: subHours(
							new Date(),
							faker.number.int({ min: 30, max: 10000 }),
						),
						...((status === 'canceled' || status === 'suspended') && {
							statusMessage: faker.lorem.lines(1),
						}),
						commissionGross: faker.number.int({ min: 100, max: 1000 }),
						commissionNet: faker.number.int({ min: 100, max: 1000 }),
					},
				});
			}

			const insureds = await database.user.findMany({
				where: {
					role: 'customer',
				},
			});

			for (let i = 0; i < 100; i++) {
				await database.marketplaceVehicle.create({
					data: {
						insured: {
							connect: {
								id: faker.helpers.arrayElement(insureds).id,
							},
						},
						photos: Array.from(
							{ length: faker.number.int({ min: 1, max: 6 }) },
							() => faker.image.url(),
						),
						type: faker.helpers.enumValue(MarketplaceVehicleType),
						manufacturer: faker.vehicle.manufacturer(),
						model: faker.vehicle.model(),
						year: faker.number.int({
							min: 1990,
							max: new Date().getFullYear(),
						}),
						modelYear: faker.number.int({
							min: 1990,
							max: new Date().getFullYear(),
						}),
						plate: 'nas6888',
						color: faker.vehicle.color(),
						fuel: faker.helpers.enumValue(MarketplaceVehicleFuel),
						transmission: faker.helpers.enumValue(
							MarketplaceVehicleTransmission,
						),
						direction: faker.helpers.enumValue(MarketplaceVehicleDirection),
						financialState: faker.helpers.enumValue(
							MarketplaceVehicleFinancialState,
						),
						price: faker.number.float({
							min: 15_000,
							max: 350_000,
							fractionDigits: 2,
						}),
						mileage: faker.number.int({ min: 0, max: 300_000 }),
						optionals: [
							faker.helpers.enumValue(SchemaMarketplaceVehicleFeatures.enum),
						],
						conservations: [
							faker.helpers.enumValue(
								SchemaMarketplaceVehicleConservations.enum,
							),
						],
						description: faker.lorem.sentences({ min: 1, max: 4 }),
						phone: faker.phone.number({ style: 'national' }),

						postalCode: faker.location.zipCode('########'),
						state: faker.location.state(),
						city: faker.location.city(),
						acceptExchange: faker.datatype.boolean(),
						acceptExchangeAmount: faker.datatype.boolean()
							? faker.helpers.enumValue(MarketplaceVehicleAcceptExchangeAmount)
							: null,
						acceptExchangeChange1: faker.datatype.boolean()
							? faker.vehicle.model()
							: null,
						acceptExchangeChange2: faker.datatype.boolean()
							? faker.vehicle.model()
							: null,
						acceptExchangeChange3: faker.datatype.boolean()
							? faker.vehicle.model()
							: null,

						status: faker.helpers.enumValue(MarketplaceVehicleStatus),
					},
				});
			}
		}
	} catch (error) {
		console.error(error);
	}
}

await seed().finally(() => database.$disconnect());
