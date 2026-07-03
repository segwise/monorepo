import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import { useInsuranceCompaniesSimple } from '@/libraries/hooks/api/insurance-companies/simple';
import { useSafes } from '@/libraries/hooks/api/safe';
import { storage } from '@/libraries/storage';
import { maskPlate, maskPostalCode } from '@segwise/core/masks';
import { translateVehicleUsage } from '@segwise/core/translate';
import type { SafeSimple } from '@segwise/core/types';
import { useQueryClient } from '@tanstack/react-query';
import { endOfDay, format, parseISO } from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { replace } from 'expo-router/build/global-state/routing';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

	const { data: insurances } = useInsuranceCompaniesSimple();

	const { push } = useRouter();

	const insurance = insurances?.find((e) => e.id === props.insuranceCompany);

	function navigateInsurance() {
		push(
			`/(stacks)/(useful-contacts)/(insurance-companies)/${props.insuranceCompany}`,
		);
	}

	async function removeItem() {
		const id = props.id;

		const insurancesIdsResponse = storage.getString('filters:insurances:ids');

		const insurancesIds = insurancesIdsResponse
			? (JSON.parse(insurancesIdsResponse) as Array<string>)
			: [];

		storage.set(
			'filters:insurances:ids',
			JSON.stringify(insurancesIds.filter((props) => props !== id)),
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
								className='font-bold text-base leading-none uppercase truncate line-clamp-1 max-w-[95%]'
							>
								{insurance?.name}
							</Text>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='font-medium text-sm leading-none text-muted-foreground mt-1'
							>
								Assistência 24 horas
							</Text>
						</View>
					</View>
					<SymbolView
						name={{
							ios: 'phone.fill.arrow.up.right',
							android: 'phone_in_talk',
						}}
						size={24}
						tintColor='#232323'
					/>
				</View>
			</TouchableOpacity>
			<Separator />
			<View className='bg-muted p-4 gap-y-3'>
				{props.insured && (
					<List label='SEGURADO(A)' value={props.insured.name.toUpperCase()} />
				)}
				{props.vehicle?.driver && (
					<List
						label='PRINCIPAL CONDUTOR'
						value={props.vehicle.driver.name.toUpperCase()}
					/>
				)}
				{props.vehicle?.plate && (
					<List label='PLACA' value={maskPlate(props.vehicle.plate)} />
				)}
				<List
					label='FINAL DA VIGÊNCIA'
					value={format(
						endOfDay(parseISO(props.expiration as string)),
						"dd/MM/yyyy 'ás' HH:mm'h'",
					).toUpperCase()}
				/>
				{props.vehicle?.model && (
					<List
						label='MODELO / ANO'
						value={`${props.vehicle.model.toUpperCase()} - ${props.vehicle.modelYear}`}
					/>
				)}
				<List
					label='USO DO VEÍCULO'
					value={translateVehicleUsage(
						props.vehicle?.usage || 'leisure_and_work',
					).toUpperCase()}
				/>
				{props.vehicle?.overnightPostalCode && (
					<List
						label='CEP DE PERNOITE'
						value={maskPostalCode(props.vehicle.overnightPostalCode)}
					/>
				)}
				{/* @ts-expect-error */}
				{props.franchise && (
					<List
						label='FRÂNQUIA'
						value={new Intl.NumberFormat('pt-BR', {
							style: 'currency',
							currency: 'BRL',
							// @ts-expect-error
						}).format(props.franchise)}
					/>
				)}
				<Separator />
				<View className='flex-row items-center justify-between'>
					<Dialog>
						<DialogTrigger asChild>
							<TouchableOpacity>
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
										Remover
									</Text>
								</View>
							</TouchableOpacity>
						</DialogTrigger>
						<DialogContent showClose={false}>
							<DialogHeader>
								<DialogTitle>Remover Registro</DialogTitle>
								<DialogDescription className='leading-none'>
									Deseja realmente remover o registro?
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<DialogClose asChild>
									<Button variant='outline'>
										<Text className='font-normal'>CANCELAR</Text>
									</Button>
								</DialogClose>
								<Button onPress={removeItem}>
									<Text className='text-white font-semibold'>REMOVER</Text>
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<View />
				</View>
			</View>
		</View>
	);
}

function InsurancesListiningScreen() {
	const { bottom } = useSafeAreaInsets();

	const { data } = useSafes();

	const { push } = useRouter();

	useEffect(() => {
		if (!data?.data.length) {
			replace('/(stacks)/(insurances)');
		}
	}, [data?.data.length]);

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View
				className='p-4'
				style={{
					marginBottom: bottom + 20,
				}}
			>
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
						<View
							className={cn(
								'flex-row items-center justify-end bg-primary rounded px-3 py-2',
								isCompany && 'bg-primary-xcar',
							)}
						>
							<Text
								allowFontScaling={false}
								accessible={false}
								className='text-sm text-white font-semibold mr-2 uppercase'
							>
								Buscar
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
					{data?.data.map((props) => (
						<Item key={props.id} {...props} />
					))}
				</View>
			</View>
		</ScrollView>
	);
}

export default InsurancesListiningScreen;
