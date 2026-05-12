import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	NativeSelectScrollView,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/libraries/classname';
import { useMarketplaceCities } from '@/libraries/hooks/api/marketplace/cities';
import { useMarketplaceStates } from '@/libraries/hooks/api/marketplace/states';
import { useMarketplaceListining } from '@/libraries/hooks/api/marketplace/vehicles';
import type { TriggerRef } from '@rn-primitives/select';
import type { MarketplaceVehicle } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ChevronsDownIcon, ChevronsUpIcon } from 'lucide-react-native';
import { Fragment, useRef, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Keyboard,
	Pressable,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VehicleCardProps {
	item: MarketplaceVehicle;
	onPress: (id: string) => void;
}

function VehicleCard({ item, onPress }: VehicleCardProps) {
	const formatCurrency = (value: number) =>
		value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

	const formatMileage = (value: number) =>
		`${value.toLocaleString('pt-BR')} km`;

	return (
		<Pressable
			onPress={() => onPress(item.id)}
			className='bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:opacity-80'
		>
			<View className='w-full h-48 bg-gray-100'>
				{item.photo ? (
					<Image
						source={{ uri: item.photo }}
						className='size-full'
						style={{
							width: '100%',
							height: '100%',
						}}
						contentFit='cover'
						priority='high'
					/>
				) : (
					<View className='flex-1 items-center justify-center'>
						<SymbolView
							name={{
								ios: 'car.fill',
								android: 'directions_car',
							}}
							size={48}
							tintColor='#D1D5DB'
						/>
					</View>
				)}
			</View>
			<View className='px-4 pt-3 pb-4 gap-y-2'>
				<View className='flex-row items-center justify-between'>
					<Text
						allowFontScaling={false}
						className='text-base font-bold text-gray-900 flex-1'
						numberOfLines={1}
					>
						{item.model.toUpperCase()}
					</Text>
					<Text
						allowFontScaling={false}
						className='text-sm font-semibold text-gray-500 ml-2'
					>
						{item.year}
					</Text>
				</View>
				<Text
					allowFontScaling={false}
					className='text-lg font-bold text-primary'
				>
					{formatCurrency(item.price)}
				</Text>
				<Separator />
				<View className='flex-row items-center justify-between'>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{
								ios: 'gauge.medium',
								android: 'speed',
							}}
							size={14}
							tintColor='#6B7280'
						/>
						<Text
							allowFontScaling={false}
							className='text-xs font-medium text-gray-500'
						>
							{formatMileage(item.mileage)}
						</Text>
					</View>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{
								ios: 'paintpalette.fill',
								android: 'palette',
							}}
							size={14}
							tintColor='#6B7280'
						/>
						<Text
							allowFontScaling={false}
							className='text-xs font-medium text-gray-500 uppercase'
						>
							{item.color}
						</Text>
					</View>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{
								ios: 'mappin.circle.fill',
								android: 'location_on',
							}}
							size={14}
							tintColor='#6B7280'
						/>
						<Text
							allowFontScaling={false}
							className='text-xs font-medium text-gray-500'
							numberOfLines={1}
						>
							{item.city} / {item.state}
						</Text>
					</View>
				</View>
			</View>
		</Pressable>
	);
}

function EmptyState() {
	return (
		<View className='flex-1 items-center justify-center gap-y-3 py-20'>
			<SymbolView
				name={{
					ios: 'car.fill',
					android: 'directions_car',
				}}
				size={48}
				tintColor='#D1D5DB'
			/>
			<Text
				allowFontScaling={false}
				className='text-base font-semibold text-gray-400 text-center'
			>
				Nenhum veículo encontrado{'\n'}com os filtros selecionados.
			</Text>
		</View>
	);
}

function MarketplaceVehicles() {
	const { push } = useRouter();
	const { bottom } = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const selectTriggerRefState = useRef<TriggerRef>(null);
	const selectTriggerRefCity = useRef<TriggerRef>(null);

	const [priceMin, setPriceMin] = useState<number | null>(null);
	const [priceMax, setPriceMax] = useState<number | null>(null);
	const [selectedState, setSelectedState] = useState<string | null>(null);
	const [selectedCity, setSelectedCity] = useState<string | null>(null);
	const [filtersVisible, setFiltersVisible] = useState<boolean>(false);

	const { isVisible: keyboardIsVisible, height: keyboardHeight } =
		useKeyboardState();

	const { data: states } = useMarketplaceStates();
	const { data: cities } = useMarketplaceCities(selectedState);

	const { data: vehicles, isPending } = useMarketplaceListining({
		limit: 100,
		priceMin,
		priceMax,
		state: selectedState,
		city: selectedCity,
	});

	const hasActiveFilters =
		priceMin !== null ||
		priceMax !== null ||
		selectedState !== null ||
		selectedCity !== null;

	function clearFilters() {
		setPriceMin(null);
		setPriceMax(null);
		setSelectedState(null);
		setSelectedCity(null);
	}

	return (
		<View className='flex-1 bg-gray-50'>
			<View className='bg-white px-4 py-4 gap-y-4 border-b border-gray-300'>
				<View
					className={cn(
						'flex-row items-center justify-between',
						filtersVisible && 'border-b border-gray-400 pb-3',
					)}
				>
					<Text
						allowFontScaling={false}
						className='text-base font-bold text-gray-800 flex-1'
					>
						Filtros
					</Text>
					{hasActiveFilters && (
						<Pressable
							onPress={clearFilters}
							className='active:opacity-60 flex-1'
						>
							<Text
								allowFontScaling={false}
								className='text-sm font-semibold text-primary'
							>
								Limpar filtros
							</Text>
						</Pressable>
					)}
					{!filtersVisible ? (
						<Pressable
							onPress={() => setFiltersVisible(true)}
							className='active:opacity-60 flex-row items-end justify-end flex-1'
						>
							<Text
								allowFontScaling={false}
								className='text-sm font-semibold text-primary'
							>
								Abrir filtros
							</Text>
							<ChevronsDownIcon size={20} />
						</Pressable>
					) : (
						<Pressable
							onPress={() => setFiltersVisible(false)}
							className='active:opacity-60 flex-row items-end justify-end'
						>
							<Text
								allowFontScaling={false}
								className='text-sm font-semibold text-primary'
							>
								Fechar filtros
							</Text>
							<ChevronsUpIcon size={20} />
						</Pressable>
					)}
				</View>
				{filtersVisible && (
					<Fragment>
						<View className='gap-y-2'>
							<Text
								allowFontScaling={false}
								className='text-xs font-semibold text-gray-500 uppercase'
							>
								Faixa de Preço
							</Text>
							<View className='flex-row gap-x-3'>
								<View className='flex-1'>
									<CurrencyInput
										value={priceMin}
										prefix='R$ '
										delimiter='.'
										separator=','
										precision={0}
										minValue={0}
										placeholder='Mínimo'
										keyboardAppearance='dark'
										maxLength={12}
										onChangeValue={(value: number | null) => setPriceMin(value)}
										renderTextInput={(props) => (
											<Input {...props} className='h-10 text-sm' />
										)}
									/>
								</View>
								<View className='flex-1'>
									<CurrencyInput
										value={priceMax}
										prefix='R$ '
										delimiter='.'
										separator=','
										precision={0}
										minValue={0}
										placeholder='Máximo'
										keyboardAppearance='dark'
										maxLength={12}
										onChangeValue={(value: number | null) => setPriceMax(value)}
										renderTextInput={(props) => (
											<Input {...props} className='h-10 text-sm' />
										)}
									/>
								</View>
							</View>
						</View>
						<View className='gap-y-2'>
							<Text
								allowFontScaling={false}
								className='text-xs font-semibold text-gray-500 uppercase'
							>
								Estado
							</Text>
							<Select
								// @ts-expect-error
								value={
									selectedState
										? { value: selectedState, label: selectedState }
										: null
								}
								onOpenChange={(open) => {
									if (open) Keyboard.dismiss();
								}}
								onValueChange={(value) => {
									setSelectedState(value?.value ?? null);
									setSelectedCity(null);
								}}
							>
								<SelectTrigger
									ref={selectTriggerRefState}
									className='h-10 text-sm'
								>
									<SelectValue
										placeholder='Selecionar cidade'
										className='capitalize flex-1'
									/>
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{states?.map((state) => (
											<SelectItem
												key={state}
												value={state}
												label={capitalizeFirstLetters(state)}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
						</View>
						<View className='gap-y-2'>
							<Text
								allowFontScaling={false}
								className='text-xs font-semibold text-gray-500 uppercase'
							>
								Cidade
							</Text>
							<Select
								// @ts-expect-error
								value={
									selectedCity
										? { value: selectedCity, label: selectedCity }
										: null
								}
								onOpenChange={(open) => {
									if (open) Keyboard.dismiss();
								}}
								onValueChange={(value) => setSelectedCity(value?.value ?? null)}
							>
								<SelectTrigger
									ref={selectTriggerRefCity}
									disabled={!selectedState}
									className='h-10 text-sm'
								>
									<SelectValue
										placeholder='Selecionar cidade'
										className='capitalize flex-1'
									/>
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{cities?.map((city) => (
											<SelectItem
												key={city}
												value={city}
												label={capitalizeFirstLetters(city)}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
						</View>
					</Fragment>
				)}
			</View>
			{isPending ? (
				<View className='flex-1 items-center justify-center'>
					<ActivityIndicator size='large' />
				</View>
			) : (
				<FlatList
					data={vehicles?.data}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<VehicleCard
							item={item}
							onPress={(id) => push(`/(stacks)/(buying-and-selling)/${id}`)}
						/>
					)}
					ListHeaderComponent={() => (
						<Button
							onPress={() => push('/(stacks)/(buying-and-selling)/my-vehicles')}
							hitSlop={8}
						>
							<Text className='text-white font-bold'>MEUS VEÍCULOS</Text>
						</Button>
					)}
					ListEmptyComponent={<EmptyState />}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 16,
						paddingBottom: bottom + 24,
						gap: 12,
					}}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps='always'
				/>
			)}
		</View>
	);
}

export default MarketplaceVehicles;
