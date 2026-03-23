import { maskCNPJ } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { FilterIcon, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from '@/components/ui/input-group';
import { Separator } from '@/components/ui/separator';

const data = [
	{
		id: '3bf7a588-36b1-4a2c-bd80-0a4541fb58a6',
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
		id: '806dc0f0-6216-49af-9fa7-22de41931e22',
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
		id: '120338c4-4da2-4b0d-991c-4b4a70cd46e4',
		name: 'aliro seguros s/a',
		short_name: 'aliro',
		registration: '61550141000172',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/120338c4-4da2-4b0d-991c-4b4a70cd46e4/logo',
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
						value: '30032127',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08007701318',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'vidros',
				contacts: [
					{
						value: '43315071',
						whatsapp: null,
						region: 'capital_and_metropolis',
					},
					{
						value: '08002202127',
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
						value: '08002202124',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
			{
				description: 'sac',
				contacts: [
					{
						value: '08002202128',
						whatsapp: null,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		id: '6b588296-0484-49b3-b1a3-56300e54495a',
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
		id: '5f5f67e2-58f0-4d2a-a174-933cee7f259a',
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
		id: '464ed884-ef62-4697-82bd-487b520272a3',
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
		id: '9be0a96f-1489-4c09-b409-51e502313097',
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
		id: '37a92a07-ab17-4b88-b071-2443aaaf7841',
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
		id: 'e1c48eab-be8e-4c9a-8034-15a56486d542',
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
		id: '1d87fcce-c431-48aa-b9c5-07d843893761',
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
		id: '59ed9068-bfd6-4c6f-b3bb-7f056dcfeda7',
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
		id: '996bdaec-5717-441c-9a16-e59ab417ebb1',
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
		id: '77bfb521-a940-4ebb-98e4-0d2ef86ce09e',
		name: 'ezze seguros s/a',
		short_name: 'ezze seguros',
		registration: '31534848000124',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/77bfb521-a940-4ebb-98e4-0d2ef86ce09e/logo',
		created_at: '2024-11-11T00:14:36.470Z',
		assistance_contacts: [],
	},
	{
		id: 'f85f4b1e-6dff-4c3f-8717-13662bef19c6',
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
		id: '8a8be33d-5e2b-4957-a4b3-bab732bdb751',
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
		id: '43b80b4e-379c-4390-82f9-1f9cefc97ac0',
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
		id: '9df4e00c-2c12-448a-94a7-50949f6854eb',
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
		id: 'a1df4caf-0bc6-4494-b3ce-1e06619e0b7f',
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
		id: 'c9d45441-d4be-4338-ac6a-d2787d8555ad',
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
		id: 'c5fbb8f5-2d0b-4ea6-96f6-bf482d5a5102',
		name: 'oceanica brasil operadora de seguros e partipacoes ltda',
		short_name: 'oceanica seguros',
		registration: '50184794000169',
		image:
			'https://eerbunnlzzosgfxsuskw.supabase.co/storage/v1/object/public/insurers/c5fbb8f5-2d0b-4ea6-96f6-bf482d5a5102/logo',
		created_at: '2023-12-05T02:38:46.183Z',
		assistance_contacts: [
			{
				description: 'assistência 24h / vidros / sinistro',
				contacts: [
					{
						value: '08007407812',
						whatsapp: true,
						region: 'all_regions',
					},
				],
			},
		],
	},
	{
		id: '79c00f92-05e3-4569-8ad8-f3f31b24fbe8',
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
		id: 'c97a1e5c-4036-4f7e-919a-a274d47a6fd4',
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
		id: '4596e171-fae1-44db-bb58-7fc01252228a',
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
		id: '6724945c-ede7-49e2-ba84-ac001b57040d',
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
		id: '46897db3-6955-49d4-8d26-d4ce4ece20c0',
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
		id: 'e296ba94-0eb6-49ac-a4e2-2469b4b4a16b',
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
		id: 'eb992f8c-d93d-4f94-bf46-88c485b53e7c',
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
		id: 'b0e841bb-7355-4f37-aed6-88fc60e5d25c',
		name: 'yelum / liberty seguros s/a',
		short_name: 'yelum / liberty seguradora',
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
		id: '5ea5573a-2697-4a28-bfc4-26017a1e48aa',
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
		id: '85c0bec0-5e29-4e92-918e-38391acac4e2',
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
];

function InsuranceCompanyPage() {
	return (
		<main className='grid grid-cols-1 gap-6 mt-1'>
			<div className='flex flex-row items-center justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2'>
					<InputGroup className='w-60'>
						<InputGroupInput placeholder='Pesquisar...' />
						<InputGroupAddon align='inline-end'>
							<InputGroupButton
								variant='default'
								size='icon-sm'
								className='size-10 -mr-2 rounded-l-none text-white'
							>
								<SearchIcon />
							</InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<Button variant='outline' className='dark:bg-primary'>
						<FilterIcon /> Filtrar{' '}
						{/* <Badge
							variant='active'
							className='size-4 text-[0.6rem] items-center justify-center pointer-events-none'
						>
							1
						</Badge> */}
					</Button>
				</div>
			</div>
			<Separator />
			<div className='grid xl:grid-cols-6 2xl:grid-cols-8 gap-4'>
				{data.map(({ name, image, registration }, index) => (
					<Card key={index.toString()} className='p-0 overflow-hidden'>
						<CardContent className='p-0'>
							<Image
								src={image}
								width={512}
								height={512}
								alt='Image do usuário'
								priority
								className='object-fill object-center xl:h-40 2xl:h-45'
							/>
							<div className='px-3 py-2 border-t'>
								<span className='block text-sm/tight font-medium capitalize line-clamp-2 truncate'>
									{capitalizeFirstLetters(name)}
								</span>
								<span className='block text-xs text-muted-foreground capitalize'>
									{maskCNPJ(registration)}
								</span>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</main>
	);
}

export default InsuranceCompanyPage;
