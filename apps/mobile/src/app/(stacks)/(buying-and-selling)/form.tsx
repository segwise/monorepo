import { Button } from '@/components/ui/button';
import { Input, InputError } from '@/components/ui/input';
import {
	NativeSelectScrollView,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import { cn } from '@/libraries/classname';
import { useMarketplaceCities } from '@/libraries/hooks/api/marketplace/cities';
import { useMarketplaceStates } from '@/libraries/hooks/api/marketplace/states';
import {
	useMarketplaceVehicleDetail,
	useMarketplaceVehicleEdit,
	useMarketplaceVehicleRegister,
} from '@/libraries/hooks/api/marketplace/vehicles';
import { storage } from '@/libraries/storage';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TriggerRef } from '@rn-primitives/select';
import { maskPlate } from '@segwise/core/masks';
import { SchemaMarketplaceVehicleRegisterForm } from '@segwise/core/schemas';
import type { MarketplaceVehicleRegisterForm } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import {
	launchImageLibraryAsync,
	requestMediaLibraryPermissionsAsync,
} from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Fragment, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
	ActivityIndicator,
	Alert,
	Image,
	Keyboard,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import {
	KeyboardAwareScrollView,
	type KeyboardAwareScrollViewRef,
	useKeyboardState,
} from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FUEL_OPTIONS = [
	{ value: 'gasoline', label: 'GASOLINA' },
	{ value: 'ethanol', label: 'ETANOL' },
	{ value: 'flex', label: 'FLEX (GASOLINA/ETANOL)' },
	{ value: 'diesel', label: 'DIESEL' },
	{ value: 'electric', label: 'ELÉTRICO' },
	{ value: 'hybrid', label: 'HÍBRIDO' },
];

const TRANSMISSION_OPTIONS = [
	{ value: 'manual', label: 'MANUAL' },
	{ value: 'automatic', label: 'AUTOMÁTICO' },
	{ value: 'cvt', label: 'CVT' },
	{ value: 'automated_manual', label: 'AUTOMATIZADO' },
];

interface LabelProps {
	title: string;
	icon: SymbolViewProps['name'];
}

function Label({ title, icon }: LabelProps) {
	return (
		<View className='flex flex-row items-center justify-start gap-x-2'>
			<View className='bg-primary rounded-full size-9 flex flex-row items-center justify-center'>
				<SymbolView name={icon} size={18} tintColor='#FFFFFF' />
			</View>
			<Text allowFontScaling={false} className='text-xl font-semibold'>
				{title}
			</Text>
		</View>
	);
}

interface PhotoPickerProps {
	photos: string[];
	onChange: (photos: string[]) => void;
}

function PhotoPicker({ photos, onChange }: PhotoPickerProps) {
	async function handleAdd() {
		const permissionResult = await requestMediaLibraryPermissionsAsync();

		if (!permissionResult.granted) {
			Alert.alert(
				'Permissão Necessária',
				'Permissão a galeria de fotos é obrigatória.',
			);
			return;
		}

		const result = await launchImageLibraryAsync({
			mediaTypes: 'images',
			allowsEditing: true,
			quality: 1,
		});

		if (!result.canceled) {
			const asset = result.assets[0];

			if (asset.uri) {
				onChange([...photos, asset.uri]);
			}
		}
	}

	function handleRemove(index: number) {
		const updated = photos.filter((_, i) => i !== index);

		onChange(updated);
	}

	return (
		<View className='gap-y-3'>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				className='gap-x-3'
			>
				<View className='flex-row gap-x-3 pr-4'>
					{photos.map((uri, index) => (
						<View key={index.toString()} className='relative'>
							<Image
								source={{ uri }}
								className='size-24 rounded-xl bg-gray-100'
								resizeMode='cover'
							/>
							<TouchableOpacity
								onPress={() => handleRemove(index)}
								className='absolute top-0 right-0 bg-red-500 rounded-full size-6 items-center justify-center'
							>
								<SymbolView
									name={{ ios: 'xmark', android: 'close' }}
									size={12}
									tintColor='#FFFFFF'
								/>
							</TouchableOpacity>
						</View>
					))}
					{photos.length < 10 && (
						<Pressable
							onPress={handleAdd}
							className='size-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center gap-y-1 active:opacity-60'
						>
							<SymbolView
								name={{ ios: 'plus', android: 'add' }}
								size={24}
								tintColor='#9CA3AF'
							/>
							<Text
								allowFontScaling={false}
								className='text-xs text-gray-400 font-medium'
							>
								Foto
							</Text>
						</Pressable>
					)}
				</View>
			</ScrollView>
			<Text allowFontScaling={false} className='text-xs text-gray-400'>
				Adicione até 10 fotos. A primeira será a foto de capa.
			</Text>
		</View>
	);
}

function MarketplaceVehicleForm() {
	const { back } = useRouter();

	const { id } = useLocalSearchParams<{ id?: string }>();

	const isEditing = !!id;

	const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

	const { isVisible: keyboardIsVisible, height: keyboardHeight } =
		useKeyboardState();

	const selectTriggerRefFuel = useRef<TriggerRef>(null);
	const selectTriggerRefTransmission = useRef<TriggerRef>(null);
	const selectTriggerRefState = useRef<TriggerRef>(null);
	const selectTriggerRefCity = useRef<TriggerRef>(null);

	const { width } = useWindowDimensions();
	const { bottom } = useSafeAreaInsets();

	const { data: vehicleData, isLoading: isLoadingData } =
		useMarketplaceVehicleDetail(id);

	const { mutate: register, isPending: isRegistering } =
		useMarketplaceVehicleRegister(
			storage.getString('buying-and-selling') as string,
		);

	const { mutate: edit, isPending: isEditing_ } = useMarketplaceVehicleEdit();

	const isPending = isRegistering || isEditing_;

	const {
		control,
		handleSubmit,
		setFocus,
		reset,
		setValue,
		formState: { isValid, isDirty },
		getFieldState,
		watch,
	} = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketplaceVehicleRegisterForm),
		defaultValues: {
			photos: [],
			model: '',
			year: '',
			price: null,
			mileage: null,
			color: '',
			plate: '',
			// @ts-expect-error
			fuel: null,
			// @ts-expect-error
			transmission: null,
			// @ts-expect-error
			state: null,
			// @ts-expect-error
			city: null,
			description: '',
		},
	});

	const { data: states } = useMarketplaceStates();
	const { data: cities } = useMarketplaceCities(watch('state.value'));

	useEffect(() => {
		if (isEditing && vehicleData) {
			reset({
				photos: vehicleData.photos ?? [],
				model: String(vehicleData.model ?? '').toUpperCase(),
				year: String(vehicleData.year ?? ''),
				price: vehicleData.price ?? null,
				mileage: vehicleData.mileage ?? null,
				color: String(vehicleData.color ?? '').toUpperCase(),
				plate: String(maskPlate(vehicleData.plate ?? '')).toUpperCase(),
				// @ts-expect-error
				fuel: vehicleData.fuel
					? {
							value: FUEL_OPTIONS.find((e) => e.value === vehicleData.fuel)
								?.value,
							label: FUEL_OPTIONS.find((e) => e.value === vehicleData.fuel)
								?.label,
						}
					: null,
				// @ts-expect-error
				transmission: vehicleData.transmission
					? {
							value: TRANSMISSION_OPTIONS.find(
								(e) => e.value === vehicleData.transmission,
							)?.value,
							label: TRANSMISSION_OPTIONS.find(
								(e) => e.value === vehicleData.transmission,
							)?.label,
						}
					: null,
				// @ts-expect-error
				state:
					vehicleData.state && typeof vehicleData.state === 'string'
						? {
								value: String(vehicleData.state).toUpperCase(),
								label: String(vehicleData.state).toUpperCase(),
							}
						: null,
				// @ts-expect-error
				city:
					vehicleData.city && typeof vehicleData.city === 'string'
						? {
								value: String(vehicleData.city).toUpperCase(),
								label: String(vehicleData.city).toUpperCase(),
							}
						: null,
				description: vehicleData.description ?? null,
			});
		}
	}, [isEditing, vehicleData, reset]);

	function onSubmit(props: MarketplaceVehicleRegisterForm) {
		Keyboard.dismiss();

		if (isEditing) {
			edit(
				{ id, ...props },
				{
					onSuccess() {
						toast.success('Veículo atualizado com sucesso!');
						back();
					},
					onError(error) {
						toast.error(error.message, { id: 'vehicle-edit' });
					},
				},
			);
		} else {
			register(props, {
				onSuccess() {
					toast.success('Veículo cadastrado com sucesso!');
					back();
				},
				onError(error) {
					toast.error(error.message, { id: 'vehicle-register' });
				},
			});
		}
	}

	if (isEditing && isLoadingData) {
		return (
			<Fragment>
				<Stack.Screen options={{ title: 'Editar Veículo' }} />
				<View className='flex-1 items-center justify-center'>
					<ActivityIndicator size='large' />
				</View>
			</Fragment>
		);
	}

	return (
		<Fragment>
			<Stack.Screen
				options={{
					title: isEditing ? 'Editar Veículo' : 'Cadastrar Veículo',
				}}
			/>
			<KeyboardAwareScrollView
				ref={scrollViewRef}
				bottomOffset={bottom + 62}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps='always'
			>
				<View className='pt-4 pb-6 px-4 gap-6'>
					<View className='gap-y-5'>
						<Label
							title='Fotos'
							icon={{
								ios: 'photo.on.rectangle.angled',
								android: 'photo_library',
							}}
						/>
						<Controller
							control={control}
							name='photos'
							render={({ field }) => (
								<PhotoPicker
									photos={(field.value as string[]) ?? []}
									onChange={field.onChange}
								/>
							)}
						/>
					</View>
					<Separator />
					<View className='gap-y-5'>
						<Label
							title='Dados do Veículo'
							icon={{ ios: 'car.fill', android: 'directions_car' }}
						/>
						<Controller
							control={control}
							name='model'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Modelo'
										placeholder='Ex: CIVIC EXL, ONIX PLUS...'
										className='uppercase'
										keyboardAppearance='dark'
										autoCapitalize='characters'
										autoCorrect={false}
										returnKeyType={
											!field.value || fieldState.invalid ? 'none' : 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											setFocus('year');
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<View className='flex-row gap-x-3'>
							<View className='flex-1'>
								<Controller
									control={control}
									name='year'
									render={({ field, fieldState }) => (
										<View>
											<Input
												{...field}
												// @ts-expect-error
												value={field.value || undefined}
												onChangeText={(value) =>
													field.onChange(value.replace(/\D/g, '').slice(0, 4))
												}
												label='Ano'
												placeholder='2023'
												keyboardAppearance='dark'
												keyboardType='number-pad'
												maxLength={4}
												returnKeyType={
													!field.value || fieldState.invalid ? 'none' : 'next'
												}
												returnKeyLabel='Próximo'
												enablesReturnKeyAutomatically
												onSubmitEditing={() => {
													if (!field.value || fieldState.invalid) return;
													setFocus('plate');
												}}
											/>
											{fieldState.error?.message && (
												<InputError>{fieldState.error.message}</InputError>
											)}
										</View>
									)}
								/>
							</View>
							<View className='flex-1'>
								<Controller
									control={control}
									name='plate'
									render={({ field, fieldState }) => (
										<View>
											<Input
												{...field}
												value={field.value || undefined}
												onChangeText={(value) =>
													field.onChange(maskPlate(value))
												}
												label='Placa'
												placeholder='AAA-0000'
												className='uppercase'
												keyboardAppearance='dark'
												autoCapitalize='characters'
												autoCorrect={false}
												maxLength={8}
												returnKeyType={
													!field.value || fieldState.invalid ? 'none' : 'next'
												}
												returnKeyLabel='Próximo'
												enablesReturnKeyAutomatically
												onSubmitEditing={() => {
													if (!field.value || fieldState.invalid) return;
													setFocus('color');
												}}
											/>
											{fieldState.error?.message && (
												<InputError>{fieldState.error.message}</InputError>
											)}
										</View>
									)}
								/>
							</View>
						</View>
						<Controller
							control={control}
							name='color'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={(value) =>
											field.onChange(value.toUpperCase())
										}
										label='Cor'
										placeholder='Ex: PRATA, PRETO, BRANCO...'
										className='uppercase'
										keyboardAppearance='dark'
										autoCapitalize='characters'
										autoCorrect={false}
										returnKeyType={
											!field.value || fieldState.invalid ? 'none' : 'next'
										}
										returnKeyLabel='Próximo'
										enablesReturnKeyAutomatically
										onSubmitEditing={() => {
											if (!field.value || fieldState.invalid) return;
											selectTriggerRefFuel.current?.open();
										}}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='fuel'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<Select
										{...field}
										onOpenChange={(open) => {
											if (open) {
												Keyboard.dismiss();
											}
										}}
										onValueChange={(value) => {
											field.onChange(value);
											const { invalid, isDirty } =
												getFieldState('transmission');
											if (!isDirty || invalid) {
												selectTriggerRefTransmission.current?.open();
											}
										}}
									>
										<SelectTrigger
											ref={selectTriggerRefFuel}
											label='Combustível'
										>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent style={{ width: width - 32 }}>
											{FUEL_OPTIONS.map((opt) => (
												<SelectItem
													key={opt.value}
													value={opt.value}
													label={opt.label}
												/>
											))}
										</SelectContent>
									</Select>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='transmission'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<Select
										{...field}
										onOpenChange={(open) => {
											if (open) {
												Keyboard.dismiss();
											}
										}}
										onValueChange={(value) => {
											field.onChange(value);
											const { invalid, isDirty } = getFieldState('state');

											if (!isDirty || invalid) {
												selectTriggerRefState.current?.open();
											}
										}}
									>
										<SelectTrigger
											ref={selectTriggerRefTransmission}
											label='Câmbio'
										>
											<SelectValue placeholder='Selecionar' />
										</SelectTrigger>
										<SelectContent style={{ width: width - 32 }}>
											{TRANSMISSION_OPTIONS.map((opt) => (
												<SelectItem
													key={opt.value}
													value={opt.value}
													label={opt.label}
												/>
											))}
										</SelectContent>
									</Select>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='state'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<Select
										{...field}
										onOpenChange={(open) => {
											if (open) {
												Keyboard.dismiss();
											}
										}}
										onValueChange={(value) => {
											field.onChange(value);

											const { invalid, isDirty } = getFieldState('city');

											// @ts-expect-error
											setValue('city', null);

											if (!isDirty || invalid) {
												selectTriggerRefCity.current?.open();
											}
										}}
									>
										<SelectTrigger ref={selectTriggerRefState} label='Estado'>
											<SelectValue placeholder='Selecionar' />
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
												{states?.map((city) => (
													<SelectItem
														key={city}
														value={city}
														label={capitalizeFirstLetters(city)}
													/>
												))}
											</NativeSelectScrollView>
										</SelectContent>
									</Select>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='city'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<Select
										{...field}
										onOpenChange={(open) => {
											if (open) {
												Keyboard.dismiss();
											}
										}}
										onValueChange={(value) => {
											field.onChange(value);
										}}
									>
										<SelectTrigger ref={selectTriggerRefCity} label='Cidade'>
											<SelectValue placeholder='Selecionar' />
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
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
					</View>
					<Separator />
					<View className='gap-y-5'>
						<Label
							title='Valores'
							icon={{ ios: 'dollarsign.circle.fill', android: 'attach_money' }}
						/>
						<Controller
							control={control}
							name='price'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<CurrencyInput
										{...field}
										prefix='R$ '
										delimiter='.'
										separator=','
										precision={2}
										minValue={0}
										placeholder='R$ 0.000,00'
										keyboardAppearance='dark'
										maxLength={14}
										onChangeValue={(value: number | null) =>
											field.onChange(value ?? null)
										}
										renderTextInput={(props) => (
											<Input {...props} label='Preço de Venda' />
										)}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<Controller
							control={control}
							name='mileage'
							render={({ field, fieldState }) => (
								<View>
									{/* @ts-expect-error */}
									<CurrencyInput
										{...field}
										suffix=' km'
										delimiter='.'
										separator=','
										precision={0}
										minValue={0}
										placeholder='0 km'
										keyboardAppearance='dark'
										maxLength={10}
										onChangeValue={(value: number | null) =>
											field.onChange(value ?? null)
										}
										renderTextInput={(props) => (
											<Input {...props} label='Quilometragem' />
										)}
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
					</View>
					<Separator />
					<View className='gap-y-5'>
						<Label
							title='Descrição'
							icon={{ ios: 'text.alignleft', android: 'description' }}
						/>
						<Controller
							control={control}
							name='description'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || undefined}
										onChangeText={field.onChange}
										label='Descrição ( Opcional )'
										placeholder='Descreva o veículo, diferenciais, revisões, etc.'
										keyboardAppearance='dark'
										multiline
										numberOfLines={4}
										textAlignVertical='top'
										className='min-h-24 pt-3'
										autoCorrect
									/>
									{fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
					</View>
					<Button
						size='lg'
						className='h-12 flex-row items-center mt-14'
						onPress={handleSubmit(onSubmit)}
						disabled={isPending || isEditing ? false : !isDirty || !isValid}
					>
						<Text className='text-base text-white font-semibold'>
							{isPending
								? isEditing
									? 'SALVANDO...'
									: 'CADASTRANDO...'
								: isEditing
									? 'SALVAR ALTERAÇÕES'
									: 'CADASTRAR VEÍCULO'}
						</Text>
						<View
							className={cn('absolute right-10', width <= 400 && 'right-6')}
						>
							{isPending && <ActivityIndicator color='#FFFFFF' />}
							{!isPending && (
								<SymbolView
									name={{
										ios: 'checkmark.circle.fill',
										android: 'check_circle',
									}}
									size={24}
									tintColor='#FFFFFF'
								/>
							)}
						</View>
					</Button>
				</View>
				<View style={{ height: bottom }} />
			</KeyboardAwareScrollView>
		</Fragment>
	);
}

export { MarketplaceVehicleForm };
