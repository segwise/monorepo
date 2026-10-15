import { maskPlate } from '@segwise/core/masks';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DollarSignIcon, InfoIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { isCompany } from '@/configs/consts/company';
import { api } from '@/libraries/api';
import { cn } from '@/libraries/classname';
import { useGetAmountSearchVehicleComplete } from '@/libraries/hooks/api/get-amount-search-vehicle-complete';

function VehicleInquiryCompleteScreen() {
	const { push, back } = useRouter();

	const { plate } = useLocalSearchParams<{ plate: string }>();

	const { data: amountSearchVehicleComplete } =
		useGetAmountSearchVehicleComplete();

	const { data, isPending, isSuccess } = useQuery({
		queryKey: ['fipe', plate],
		queryFn: async () => {
			return (await api.get(`/fipe/${plate}`)).data;
		},
	});

	function goCheckout() {
		push(`/(vehicle-inquiry)/checkout-complete?plate=${plate}`);
	}

	useEffect(() => {
		if (!isPending && !isSuccess) {
			back();
		}
	}, [isPending, isSuccess, back]);

	if (isPending) {
		return;
	}

	return (
		<ScrollView
			className='flex-1'
			contentContainerClassName='p-5 pb-10'
			showsVerticalScrollIndicator={false}
		>
			<View className='mb-4'>
				<Text className='text-xs font-bold tracking-widest uppercase text-foreground'>
					Vai comprar?
				</Text>
				<Text className='text-3xl font-bold tracking-tight'>
					Evite surpresas
				</Text>
				<Text className='text-sm text-muted-foreground leading-5'>
					Confira o histórico antes de fechar negócio.
				</Text>
			</View>
			<View
				className={cn(
					'flex-row items-center gap-3 bg-primary/5 border border-primary rounded-md p-3 mb-5',
					isCompany && 'bg-primary-xcar/5 border-primary-xcar',
				)}
			>
				<InfoIcon size={18} color='black' />
				<Text
					className={cn(
						'text-xs text-primary leading-5 font-medium',
						isCompany && 'text-primary-xcar',
					)}
				>
					Verifique o veículo antes de qualquer pagamento.
				</Text>
			</View>
			<Text className='text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2'>
				Consulta veicular
			</Text>
			<View
				className={cn(
					'bg-white rounded-lg border-2 border-primary overflow-hidden mb-3',
					isCompany && 'border-primary-xcar',
				)}
			>
				<View
					className={cn(
						'flex-row items-center gap-4 bg-primary px-4 py-4',
						isCompany && 'bg-primary-xcar',
					)}
				>
					<View className='flex-1'>
						<Text className='text-xs text-white mb-0.5 uppercase'>Placa</Text>
						<Text className='text-lg font-bold text-white leading-none'>
							{maskPlate(data.plate)}
						</Text>
					</View>
				</View>
				<View className='px-4'>
					<DataRow
						label='Marca / Modelo'
						value={`${data.manufacturer} / ${data.model}`}
					/>
					<DataRow label='Ano' value={data.year} />
					<DataRow label='Combustível' value={data.fuel} />
				</View>
			</View>
			<View
				className={cn(
					'bg-white rounded-lg border-2 border-primary p-4 flex-row items-center justify-between',
					isCompany && 'border-primary-xcar',
				)}
			>
				<View className='flex-1'>
					<Text className='text-base font-medium text-neutral-900 mb-0.5'>
						Histórico completo
					</Text>
					<Text className='text-xs text-muted-foreground'>
						Multas, leilão, roubo, débitos...
					</Text>
				</View>
				<Text className='text-base font-medium text-neutral-900 mb-0.5'>
					{amountSearchVehicleComplete?.amount
						? new Intl.NumberFormat('pt-BR', {
								style: 'currency',
								currency: 'BRL',
							}).format(amountSearchVehicleComplete.amount)
						: undefined}
				</Text>
			</View>
			<Button className='w-full mt-6' onPress={goCheckout}>
				<Text className='text-white text-base font-medium uppercase'>
					Realizar Pagamento <DollarSignIcon size={18} color='#FFFFFF' />
				</Text>
			</Button>
		</ScrollView>
	);
}

type DataRowProps = {
	label: string;
	value?: string;
	valueElement?: React.ReactNode;
	isLast?: boolean;
};

function DataRow({ label, value, valueElement, isLast }: DataRowProps) {
	return (
		<View
			className={`flex-row items-center justify-between py-3 gap-x-4 ${
				!isLast
					? cn(
							'border-b border-primary/20',
							isCompany && 'border-primary-xcar/20',
						)
					: ''
			}`}
		>
			<Text className='text-sm text-neutral-500'>{label}</Text>
			{valueElement ?? (
				<Text className='text-sm font-medium text-foreground flex-1 text-right'>
					{value}
				</Text>
			)}
		</View>
	);
}

export default VehicleInquiryCompleteScreen;
