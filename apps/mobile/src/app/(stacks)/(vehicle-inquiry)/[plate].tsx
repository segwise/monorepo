import { Button } from '@/components/ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { isCompany } from '@/configs/consts/company';
import { api } from '@/libraries/api';
import { cn } from '@/libraries/classname';
import { useGetAmountSearchVehicleComplete } from '@/libraries/hooks/api/get-amount-search-vehicle-complete';
import { maskPlate } from '@segwise/core/masks';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
	AlertTriangleIcon,
	ChevronLeftIcon,
	FileWarningIcon,
	ReceiptIcon,
} from 'lucide-react-native';
import { useEffect } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from 'react-native';
import { useMMKVObject } from 'react-native-mmkv';

function VehicleInquiryPlateScreen() {
	const { push, back } = useRouter();

	const { plate } = useLocalSearchParams<{
		plate: string;
	}>();

	const [histories, setHistories] = useMMKVObject<
		Array<{
			plate: string;
			model: string;
			year: number;
		}>
	>('vehicle-inquiry-plate');

	const { data, isPending, isSuccess } = useQuery({
		queryKey: ['fipe', plate],
		queryFn: async () => {
			return (await api.get(`/fipe/${plate}`)).data;
		},
	});

	const { data: amountSearchVehicleComplete } =
		useGetAmountSearchVehicleComplete();

	useEffect(() => {
		if (isSuccess && data) {
			const newCache =
				histories?.filter(
					(e) => e.plate.toLowerCase() !== plate.toLowerCase(),
				) || [];

			newCache.push({
				plate: data.plate.toLowerCase(),
				model: data.model.toLowerCase(),
				year: Number(data.year),
			});

			setHistories(newCache);
		}
	}, [data, isSuccess, plate, histories, setHistories]);

	useEffect(() => {
		if (!isPending && !isSuccess) {
			back();
		}
	}, [isPending, isSuccess, back]);

	if (isPending) {
		return (
			<View className='flex-1 items-center justify-center'>
				<View>
					<ActivityIndicator size='large' color='#000000' />
					<Text className='text-lg font-semibold mt-2 text-black'>
						CARREGANDO
					</Text>
				</View>
			</View>
		);
	}

	if (!data) {
		return (
			<View className='flex-1 items-center justify-center'>
				<Text className='text-lg font-semibold text-black'>
					NENHUM REGISTRO ENCONTRADO!
				</Text>
				<Button size='lg' className='mt-3' onPress={back}>
					<ChevronLeftIcon color='#FFFFFF' />
					<Text className='text-white font-semibold text-lg'>
						Voltar Página
					</Text>
				</Button>
			</View>
		);
	}

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			<View className='p-4 gap-4'>
				<Stack.Screen
					options={{
						title: 'Resultado da Consulta',
					}}
				/>
				<View
					className={cn(
						'border-2 border-primary rounded-md p-4 overflow-hidden relative',
						isCompany && 'border-primary-xcar',
					)}
				>
					<View
						className={cn(
							'bg-primary py-1.5 -mx-4 -mt-4 mb-3',
							isCompany && 'bg-primary-xcar',
						)}
					>
						<Text className='text-center text-white font-medium uppercase text-sm'>
							Veículo Encontrado
						</Text>
					</View>
					<View>
						<View>
							<Text className='text-xl font-extrabold text-foreground uppercase'>
								{data.model}
							</Text>
							<Text className='text-sm leading-none text-muted-foreground'>
								{data.year} / {data.yearModel} · {data.exchage} · {data.color}
							</Text>
						</View>
						<View className='flex-row items-end justify-between'>
							<View className='flex-row items-center mt-3 border-2 border-input rounded-sm self-start px-2 py-1 relative overflow-hidden'>
								<View className='flex-row items-center justify-center bg-input -ml-2 w-6 h-5 mr-2'>
									<Text className='text-white text-xs'>BR</Text>
								</View>
								<Text className='text-base font-bold'>
									{maskPlate(data.plate)}
								</Text>
							</View>
							<Text className='text-sm font-medium text-muted-foreground'>
								{data.address.city
									? `${capitalizeFirstLetters(data.address.city)} / `
									: ''}
								{data.address.uf.toUpperCase()}
							</Text>
						</View>
					</View>
				</View>
				<Separator />
				<View className='gap-5'>
					<View className='flex flex-row items-center justify-start gap-x-2'>
						<View
							className={cn(
								'bg-primary rounded-full size-9 flex flex-row items-center justify-center',
								isCompany && 'bg-primary-xcar',
							)}
						>
							<SymbolView
								name={{
									ios: 'car.fill',
									android: 'car_tag',
								}}
								size={18}
								tintColor='#FFFFFF'
							/>
						</View>
						<Text allowFontScaling={false} className='text-xl font-semibold'>
							Dados do Veículo
						</Text>
					</View>
					<Input
						label='Marca / Modelo'
						placeholder='Marca / Modelo'
						className='uppercase'
						autoCapitalize='characters'
						autoComplete='off'
						autoCorrect={false}
						keyboardAppearance='dark'
						returnKeyLabel='Próximo'
						enablesReturnKeyAutomatically
						readOnly
						value={`${data.manufacturer} - ${data.model}`}
					/>
					<Input
						label='Ano Fabricação / Modelo'
						placeholder='Ano Fabricação / Modelo'
						className='uppercase'
						autoCapitalize='characters'
						autoComplete='off'
						autoCorrect={false}
						keyboardAppearance='dark'
						returnKeyLabel='Próximo'
						enablesReturnKeyAutomatically
						readOnly
						value={`${data.year} - ${data.yearModel}`}
					/>
					<Input
						label='Cor'
						placeholder='Cor'
						className='uppercase'
						autoCapitalize='characters'
						autoComplete='off'
						autoCorrect={false}
						keyboardAppearance='dark'
						returnKeyLabel='Próximo'
						enablesReturnKeyAutomatically
						readOnly
						value={data.color}
					/>
					{data.fuel && (
						<Input
							label='Combustível'
							placeholder='Combustível'
							className='uppercase'
							autoCapitalize='characters'
							autoComplete='off'
							autoCorrect={false}
							keyboardAppearance='dark'
							returnKeyLabel='Próximo'
							enablesReturnKeyAutomatically
							readOnly
							value={data.fuel}
						/>
					)}
					{data.chassi && (
						<Input
							label='Chassi'
							placeholder='Chassi'
							className='uppercase'
							autoCapitalize='characters'
							autoComplete='off'
							autoCorrect={false}
							keyboardAppearance='dark'
							returnKeyLabel='Próximo'
							enablesReturnKeyAutomatically
							readOnly
							value={data.chassi}
						/>
					)}
					<Input
						label='Município / UF'
						placeholder='Município / UF'
						className='uppercase'
						autoCapitalize='characters'
						autoComplete='off'
						autoCorrect={false}
						keyboardAppearance='dark'
						returnKeyLabel='Próximo'
						enablesReturnKeyAutomatically
						readOnly
						value={`${data.address.city ? `${data.address.city} - ` : ''}${data.address.uf}`}
					/>
				</View>
				<Separator />
				{!!data.fipe.length && (
					<View>
						<View className='border-2 border-black rounded-lg overflow-hidden'>
							<View className='bg-white px-4 py-4'>
								<View className='flex-row items-center justify-between'>
									<Text className='text-xs font-bold text-black uppercase'>
										Valor Médio FIPE
									</Text>
								</View>
								<Text className='text-3xl font-black text-black mt-1 leading-tight'>
									{new Intl.NumberFormat('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}).format(data.fipe[0].value)}
								</Text>
								<Text className='text-sm text-slate-700 font-medium'>
									{capitalizeFirstLetters(data.fipe[0].model)}
								</Text>
								<Text className='text-xs text-slate-500 mt-0.5 leading-none'>
									Código FIPE: {data.fipe[0].code}
								</Text>
								<View className='flex-row mt-4 pt-3 border-t border-t-input'>
									<View className='flex-1'>
										<Text className='text-xs capitalize text-slate-500 font-semibold'>
											Combustível
										</Text>
										<Text className='text-sm leading-none font-bold text-black mt-0.5'>
											{capitalizeFirstLetters(data.fipe[0].fuel)}
										</Text>
									</View>
								</View>
							</View>
							{data.fipe.length > 1 && (
								<Collapsible>
									<CollapsibleTrigger className='flex-row items-center justify-between px-4 py-2 bg-slate-50 active:bg-slate-100 border-t-2'>
										<View className='flex-row items-center gap-2'>
											<Text className='text-base font-extrabold text-destructive uppercase'>
												Ver outras versões
											</Text>
											<View className='bg-destructive size-5 rounded-full items-center justify-center'>
												<Text className='text-white text-xs font-bold'>
													{data.fipe.length}
												</Text>
											</View>
										</View>
										<View>
											<SymbolView name='plus' size={20} tintColor='black' />
										</View>
									</CollapsibleTrigger>
									<CollapsibleContent>
										<View className='bg-white border-t-2 pt-2'>
											{(
												data.fipe as Array<{
													value: number;
													model: string;
													year: number;
													code: string;
													fuel: string;
													reference: string;
												}>
											).map((item) => (
												<Pressable
													key={item.code}
													className='flex-row items-center gap-3 px-3 py-2'
												>
													<View className='flex-1 min-w-0'>
														<Text className='text-[13px] font-bold text-black'>
															{capitalizeFirstLetters(item.model)}
														</Text>
														<Text className='text-xs text-slate-500 mt-0.5'>
															{item.year} · {capitalizeFirstLetters(item.fuel)}
														</Text>
													</View>
													<View className='items-end'>
														<Text className='text-[13px] font-bold text-black'>
															{new Intl.NumberFormat('pt-BR', {
																style: 'currency',
																currency: 'BRL',
															}).format(item.value)}
														</Text>
														<Text className='text-xs text-slate-500 mt-0.5'>
															Código FIPE: {item.code}
														</Text>
													</View>
												</Pressable>
											))}
										</View>
									</CollapsibleContent>
								</Collapsible>
							)}
						</View>
						<Text className='text-sm text-slate-500 mt-2 text-center px-4 leading-tight'>
							Versões compatíveis com mesmo modelo e anos próximos.
						</Text>
					</View>
				)}
				<View className='-mx-4 bg-black px-4 py-3 flex-row items-center justify-center'>
					<Text className='text-white font-bold text-sm tracking-widest uppercase text-center w-full'>
						Consulta Completa
					</Text>
				</View>
				<View className='mt-2 rounded-lg bg-slate-50 border-2 border-input p-4'>
					<Text className='text-xl font-black text-black uppercase tracking-tight leading-snug'>
						Desbloqueie todos os detalhes
					</Text>
					<Text className='text-sm text-slate-700 mt-2 leading-tight'>
						Histórico de débitos, multas, leilões e restrições e outros dados
						complementares
					</Text>
					<View className='mt-4 bg-white rounded-md border-2 border-input'>
						<View className='flex-row items-center gap-3 py-3 px-4 border-b border-b-input'>
							<View className='size-9 rounded-full items-center justify-center'>
								<AlertTriangleIcon size={16} color='#94a3b8' />
							</View>
							<View className='flex-1'>
								<Text className='text-sm leading-none font-bold text-black'>
									Multas
								</Text>
								<Text className='text-xs text-slate-500' numberOfLines={1}>
									Gravame e infrações
								</Text>
							</View>
							<SymbolView name='lock' size={16} tintColor='#94a3b8' />
						</View>
						<View className='flex-row items-center gap-3 py-3 px-4 border-b border-b-input'>
							<View className='size-9 rounded-full items-center justify-center'>
								<ReceiptIcon size={16} color='#94a3b8' />
							</View>
							<View className='flex-1'>
								<Text className='text-sm leading-none font-bold text-black'>
									Débitos e IPVA
								</Text>
								<Text className='text-xs text-slate-500' numberOfLines={1}>
									Tributos, licenciamento, DPVAT
								</Text>
							</View>
							<SymbolView name='lock' size={16} tintColor='#94a3b8' />
						</View>
						<View className='flex-row items-center gap-3 py-3 px-4 border-b border-b-input'>
							<View className='size-9 rounded-full items-center justify-center'>
								<FileWarningIcon size={16} color='#94a3b8' />
							</View>
							<View className='flex-1'>
								<Text className='text-sm leading-none font-bold text-black'>
									Restrições e Leilão
								</Text>
								<Text className='text-xs text-slate-500' numberOfLines={1}>
									Roubo, sinistro, gravame
								</Text>
							</View>
							<SymbolView name='lock' size={16} tintColor='#94a3b8' />
						</View>
					</View>
					<View className='mt-4 flex-row items-baseline justify-center gap-1'>
						<Text className='text-xs text-slate-600 uppercase font-semibold'>
							Por
						</Text>
						<Text className='text-[24px] font-black text-black'>
							R$ ___,__
							{/* {amountSearchVehicleComplete?.amount
								? new Intl.NumberFormat('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}).format(amountSearchVehicleComplete.amount)
								: undefined} */}
						</Text>
					</View>
					<Button
						disabled
						className='flex-row items-center justify-center gap-2 mt-3 rounded-md'
						onPress={() => push(`/(vehicle-inquiry)/complete?plate=${plate}`)}
					>
						<SymbolView name='lock' size={16} tintColor='#FFFFFF' />
						<Text className='text-white font-bold text-sm leading-none uppercase'>
							Desbloquear Consulta Completa
						</Text>
						<SymbolView name='arrow.right' size={16} tintColor='#FFFFFF' />
					</Button>
					<Text className='text-center'>Em construção</Text>
				</View>
				<Text className='text-sm text-center text-slate-500 px-4 mt-4 mb-6 leading-tight'>
					Dados obtidos junto a fontes oficiais (DENATRAN/SENATRAN).
				</Text>
			</View>
		</ScrollView>
	);
}

export default VehicleInquiryPlateScreen;
