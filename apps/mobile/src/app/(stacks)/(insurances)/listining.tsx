import { Separator } from '@/components/ui/separator';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/api/insurance-companies/simple';
import { useSafes } from '@/libraries/hooks/api/safe';
import { storage } from '@/libraries/storage';
import { maskPlate, maskPostalCode } from '@segwise/core/masks';
import { translateVehicleUsage } from '@segwise/core/translate';
import type { SafeSimple } from '@segwise/core/types';
import { useQueryClient } from '@tanstack/react-query';
import {
	differenceInDays,
	endOfDay,
	format,
	formatDistanceStrict,
	parseISO,
} from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { replace } from 'expo-router/build/global-state/routing';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

function List({ label, value }: { label: string; value: string }) {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-sm font-normal leading-none text-muted-foreground'
			>
				{label}
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base font-semibold'
			>
				{value}
			</Text>
		</View>
	);
}

function Item(props: SafeSimple) {
	const queryClient = useQueryClient();
	const { push } = useRouter();
	const { data: insurances } = useInsuranceCompaniesSimple();

	const insurance = insurances?.find((e) => e.id === props.insuranceCompany);

	function navigateInsurance() {
		push(
			`/(stacks)/(useful-contacts)/(insurance-companies)/${props.insuranceCompany}`,
		);
	}

	async function removeItem() {
		const id = props.id;

		const insurancesExcludesResponse = storage.getString(
			'filters:insurances:ids:excludes',
		);

		const insurancesExcludes = insurancesExcludesResponse
			? (JSON.parse(insurancesExcludesResponse) as Array<string>)
			: [];

		if (!insurancesExcludes.includes(id)) {
			insurancesExcludes.push(id);
		}

		storage.set(
			'filters:insurances:ids:excludes',
			JSON.stringify(insurancesExcludes),
		);

		await queryClient.refetchQueries({
			queryKey: ['safes'],
		});
	}

	return (
		<View className='rounded border border-border'>
			<TouchableOpacity onPress={navigateInsurance}>
				<View className='flex-row items-center justify-between px-4 py-3'>
					<View className='flex-row items-center justify-start gap-x-2 flex-1'>
						<View className='size-10 rounded overflow-hidden'>
							<Image
								source={insurance?.icon}
								style={{
									width: '100%',
									height: '100%',
								}}
							/>
						</View>
						<View className='flex-1'>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='font-bold text-base leading-none uppercase'
							>
								{insurance?.name}
							</Text>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='font-medium text-sm leading-none text-muted-foreground mt-0.5'
							>
								Assistência 24 horas
							</Text>
						</View>
					</View>
					<SymbolView
						name={{
							ios: 'arrow.right',
							android: 'arrow_right',
						}}
						size={24}
						tintColor='#232323'
					/>
				</View>
			</TouchableOpacity>
			<Separator />
			<View className='bg-muted p-4 gap-y-3'>
				{props.vehicle?.plate && (
					<List label='PLACA' value={maskPlate(props.vehicle.plate)} />
				)}
				<List
					label='FINAL DA VIGÊNCIA'
					value={`${format(
						endOfDay(parseISO(props.expiration as string)),
						"dd/MM/yyyy 'ás' HH:mm'h'",
					).toUpperCase()} ${
						differenceInDays(
							parseISO(props.expiration as string),
							new Date(),
						) <= 30
							? ` - ${formatDistanceStrict(
									parseISO(props.expiration as string),
									new Date(),
								)}`
							: ''
					}`}
				/>
				{props.vehicle?.model && (
					<List
						label='MODELO / ANO'
						value={`${props.vehicle.model.toUpperCase()} ${props.vehicle.modelYear}`}
					/>
				)}
				<List
					label='USO DO VEÍCULO'
					value={translateVehicleUsage(
						props.vehicle?.usage || 'leisure_and_work',
					).toUpperCase()}
				/>
				{props.franchise && (
					<List
						label='FRÂNQUIA'
						value={new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
						}).format(props.franchise)}
					/>
				)}
				{props.insured && (
					<List label='SEGURADO(A)' value={props.insured.name.toUpperCase()} />
				)}
				{props.vehicle?.driver && (
					<List
						label='PRINCIPAL CONDUTOR'
						value={props.vehicle.driver.name.toUpperCase()}
					/>
				)}
				{props.vehicle?.overnightPostalCode && (
					<List
						label='CEP DE PERNOITE'
						value={maskPostalCode(props.vehicle.overnightPostalCode)}
					/>
				)}
				<Separator />
				<View className='flex-row items-center justify-between'>
					<TouchableOpacity onPress={removeItem}>
						<View className='flex-row items-center justify-start gap-x-1'>
							<SymbolView
								name={{
									ios: 'x.circle',
									android: 'close',
								}}
								size={18}
								tintColor='red'
							/>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-base font-semibold'
								style={{
									color: 'red',
								}}
							>
								Excluir
							</Text>
						</View>
					</TouchableOpacity>
					<View />
				</View>
			</View>
		</View>
	);
}

function InsurancesListiningScreen() {
	const { data } = useSafes();

	const { push } = useRouter();

	useEffect(() => {
		if (!data?.data.length) {
			replace('/(stacks)/(insurances)');
		}
	}, [data?.data.length]);

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='p-4'>
				<View className='flex-row items-center justify-between'>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-xl font-medium'
					>
						Seguros:{' '}
						<Text className='font-extrabold'>{data?.data.length || 0}</Text>
					</Text>
					<TouchableOpacity onPress={() => push('/(stacks)/(insurances)')}>
						<View className='flex-row items-center justify-end bg-primary rounded px-3 py-2'>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-sm text-white font-semibold mr-2 uppercase'
							>
								Pesquisar
							</Text>
							<SymbolView
								name={{
									ios: 'magnifyingglass',
									android: 'search',
								}}
								size={18}
								tintColor='#FFFFFF'
							/>
						</View>
					</TouchableOpacity>
				</View>
				<View className='gap-y-4 mt-4 mb-20'>
					{data?.data
						// @ts-expect-error
						.sort((a, b) => parseISO(a.expiration) - parseISO(b.expiration))
						.filter((e) => parseISO(e.expiration as string) >= new Date())
						.map((props) => (
							<Item key={props.id} {...props} />
						))}
				</View>
			</View>
		</ScrollView>
	);
}

export default InsurancesListiningScreen;
