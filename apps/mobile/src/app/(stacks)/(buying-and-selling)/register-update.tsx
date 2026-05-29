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
import { Input, InputError } from '@/components/ui/input';
import {
	NativeSelectScrollView,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { api } from '@/libraries/api';
import { cn } from '@/libraries/classname';
import { storage } from '@/libraries/storage';
import Feather from '@expo/vector-icons/Feather';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '@react-navigation/native';
import type { TriggerRef } from '@rn-primitives/select';
import { maskPhone, maskPlate, maskPostalCode } from '@segwise/core/masks';
import {
	SchemaMarketplaceRegister,
	SchemaMarketplaceVehicleColor,
	SchemaMarketplaceVehicleDirection,
	SchemaMarketplaceVehicleFuel,
	SchemaVehicleExchange,
} from '@segwise/core/schemas';
import { isPlate } from '@segwise/core/valids';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useEffect, useRef } from 'react';
import {
	Controller,
	type FieldValues,
	useController,
	type UseControllerProps,
	useForm,
} from 'react-hook-form';
import {
	ActivityIndicator,
	Keyboard,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	Text,
	type TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { XiorError } from 'xior';
import type z from 'zod';

const directions = [
	{
		id: 'hydraulics',
		label: 'hidráulica'.toUpperCase(),
	},
	{
		id: 'electric',
		label: 'elétrica'.toUpperCase(),
	},
	{
		id: 'mechanics',
		label: 'mecânica'.toUpperCase(),
	},
	{
		id: 'assisted',
		label: 'assistida'.toUpperCase(),
	},
];

const fuels = [
	{
		id: 'gasoline',
		label: 'gasolina'.toUpperCase(),
	},
	{
		id: 'alcohol',
		label: 'álcool'.toUpperCase(),
	},
	{
		id: 'ethanol',
		label: 'Etanol'.toUpperCase(),
	},
	{
		id: 'flex',
		label: 'flex'.toUpperCase(),
	},
	{
		id: 'diesel',
		label: 'diesel'.toUpperCase(),
	},
	{
		id: 'hybrid',
		label: 'híbrido'.toUpperCase(),
	},
	{
		id: 'electric',
		label: 'elétrico'.toUpperCase(),
	},
];

const exchanges = [
	{
		id: 'manual',
		label: 'MANUAL',
	},
	{
		id: 'automatic',
		label: 'AUTOMÁTICO',
	},
	{
		id: 'semi_automatic',
		label: 'SEMI-AUTOMÁTICO',
	},
];

const featuresArray = [
	{ id: 'air_barg', name: 'air Bag' },
	{ id: 'alarm', name: 'alarme' },
	{ id: 'air_conditioning', name: 'ar Condicionado' },
	{ id: 'electric_locks', name: 'travas Elétricas' },
	{ id: 'electric_windows', name: 'vidros Elétricos' },
	{ id: 'sound', name: 'som' },
	{ id: 'reverse_sensor', name: 'sensor de Ré' },
	{ id: 'reversing_camera', name: 'câmera de Ré' },
];
const colorsVariable = [
	{ id: 'black', name: 'preto'.toUpperCase() },
	{ id: 'blue', name: 'azul'.toUpperCase() },
	{ id: 'brown', name: 'marrom'.toUpperCase() },
	{ id: 'gray', name: 'cinza'.toUpperCase() },
	{ id: 'green', name: 'verde'.toUpperCase() },
	{ id: 'orange', name: 'laranja'.toUpperCase() },
	{ id: 'pink', name: 'rosa'.toUpperCase() },
	{ id: 'purple', name: 'roxo'.toUpperCase() },
	{ id: 'red', name: 'vermelho'.toUpperCase() },
	{ id: 'white', name: 'branco'.toUpperCase() },
	{ id: 'yellow', name: 'amarelo'.toUpperCase() },
];

const financial_state_array = [
	{ id: 'financed', name: 'financiado' },
	{ id: 'settled', name: 'quitado' },
];

type ImageAsset = {
	uri: string;
	file?: File;
	fileName?: string;
	mimeType?: string;
};

export default function SendMyVehiclesBuy() {
	const { id } = useLocalSearchParams<{
		id: string;
	}>();

	const { back } = useRouter();

	const { colors } = useTheme();

	const { width } = useWindowDimensions();

	const { isVisible: keyboardIsVisible, height: keyboardHeight } =
		useKeyboardState();

	const plateRef = useRef<TextInput>(null);
	const brandRef = useRef<TextInput>(null);
	const modelRef = useRef<TextInput>(null);
	const modelYearRef = useRef<TextInput>(null);
	const exchangeRef = useRef<TriggerRef>(null);
	const fuelRef = useRef<TriggerRef>(null);
	const directionRef = useRef<TriggerRef>(null);
	const KMRef = useRef<TextInput>(null);
	const colorRef = useRef<TriggerRef>(null);
	const priceRef = useRef<TextInput>(null);
	const zipCodeRef = useRef<TextInput>(null);
	const phoneRef = useRef<TextInput>(null);
	const descriptionRef = useRef<TextInput>(null);

	const vehicleChange1Ref = useRef<TextInput>(null);
	const vehicleChange2Ref = useRef<TextInput>(null);
	const vehicleChange3Ref = useRef<TextInput>(null);

	const { control, handleSubmit, reset, setValue, watch } = useForm({
		mode: 'all',
		criteriaMode: 'all',
		reValidateMode: 'onChange',
		resolver: zodResolver(SchemaMarketplaceRegister),
		defaultValues: {
			insured: storage.getString('authenticated_marketing'),
			images: [],
			plate: '',
			postalCode: '',
			phone: '',
			model: '',
			modelYear: '',
			description: '',
			optionals: [],
			conservations: [],
		},
	});

	const type = watch('type');
	const optionals = watch('optionals');
	const conservations = watch('conservations');
	const financialState = watch('financialState');
	const acceptExchange = watch('acceptExchange');
	const vehicleChangeAmount = watch('acceptExchangeAmount');

	const { mutate: sendMarketingPlace, isPending } = useMutation<
		unknown,
		Error,
		z.infer<typeof SchemaMarketplaceRegister>
	>({
		mutationKey: ['marketplace', !id ? 'register' : 'update'],
		mutationFn: async (props) => {
			try {
				const formData = new FormData();

				for (const image of props.images) {
					if (image instanceof File) {
						formData.append('images', image);
					} else if (typeof image !== 'string') {
						formData.append('images', {
							uri: image.uri,
							name: image.fileName,
							type: image.mimeType,
						} as unknown as Blob);
					} else {
						formData.append('images', image);
					}
				}

				for (const item of props.optionals ?? []) {
					formData.append('optionals', item);
				}
				for (const item of props.conservations ?? []) {
					formData.append('conservations', item);
				}

				const skip = new Set(['images', 'optionals', 'conservations']);

				for (const [key, value] of Object.entries(props)) {
					if (skip.has(key)) {
						continue;
					}

					if (value === null || value === undefined) {
						continue;
					}

					if (key === 'price') {
						formData.append(
							key,
							new Intl.NumberFormat('pt-BR', {
								style: 'currency',
								currency: 'BRL',
							}).format(Number(value)),
						);
					} else {
						formData.append(key, String(value));
					}
				}

				const url = new URL(api.config?.baseURL as string);

				if (id) {
					url.pathname = `/marketplace/${id}`;
				} else {
					url.pathname = '/marketplace';
				}

				const response = await fetch(url.toString(), {
					method: !id ? 'POST' : 'PATCH',
					body: formData,
				});

				if (!response.ok) {
					const data = await response.json();

					throw new Error(data.message);
				}

				const data = await response.json();

				return data;
			} catch (error) {
				let message = `Falha ao ${id ? 'atualizar' : 'registrar'}`;

				if (error instanceof Error) {
					message = error.message;
				}

				if (error instanceof XiorError) {
					message = error.response?.data.message;
				}

				throw new Error(message);
			}
		},
		onSuccess(_, __, ___, { client }) {
			toast.success(id ? 'ALTERADO COM SUCESSO!' : 'ANUNCIADO COM SUCESSO!');

			reset();

			client.resetQueries({
				queryKey: ['marketplace'],
			});

			back();
		},
		onError(error) {
			toast.dismiss();

			toast.error((error.message || 'FALHA AO ENVIAR').toUpperCase());
		},
	});

	const { mutate: refetchPlate } = useMutation<unknown, Error, string>({
		mutationKey: ['marketplace', 'plate'],
		mutationFn: async (plate) => {
			try {
				if (!isPlate(plate)) return;

				const data = (await api.get(`/vehicles/${plate.replaceAll('-', '')}`))
					.data;

				toast.dismiss();

				if (data) {
					setValue('manufacturer', data.manufacturer.name?.toUpperCase());
					setValue('model', data.model?.toUpperCase());
					setValue('modelYear', String(data.modelYear));
				}

				return !!data;
			} catch (error) {
				let message = 'Falha ao encontrar placa';

				if (error instanceof XiorError) {
					message = error.response?.data.message;
				}

				toast.error(message.toUpperCase());

				throw new Error(message.toUpperCase());
			}
		},
	});

	const { isSuccess, data: listining } = useQuery({
		queryKey: ['marketplace', id],
		queryFn: async ({ signal }) => {
			return (
				await api.get(`/marketplace/${id}`, {
					signal,
				})
			).data;
		},
		enabled: !!id,
	});

	const { mutate: deleteItem, isPending: isDeleting } = useMutation({
		mutationKey: ['marketplace', id, 'delete'],
		mutationFn: async () => {
			return (await api.delete(`/marketplace/${id}`)).data;
		},
		onSuccess(_, __, ___, { client }) {
			toast.success('EXCLUÍDO COM SUCESSO');

			client.resetQueries({
				queryKey: ['marketplace'],
			});

			back();
		},
		onError() {
			toast.error('FALHA AO EXCLUIR');
		},
	});

	const pickImage = async (): Promise<ImageAsset | null> => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: 'images',
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
			base64: true,
		});

		if (!result.canceled) {
			const file = result.assets[0];

			return {
				uri: file.uri,
				fileName:
					file.fileName || `nome-do-arquivo-${Math.random() * 100000}.jpg`,
				mimeType: file.mimeType,
			};
		}

		return null;
	};

	useEffect(() => {
		if (isSuccess && listining) {
			setValue('plate', maskPlate(listining.plate));
			setValue('manufacturer', String(listining.manufacturer).toUpperCase());
			setValue('model', String(listining.model).toUpperCase());
			setValue('modelYear', String(listining.modelYear).toUpperCase());
			setValue('exchange', listining.transmission);
			setValue('fuel', listining.fuel);
			setValue('direction', listining.direction);
			setValue('km', listining.mileage);
			setValue('type', listining.type);
			setValue('optionals', listining.optionals || []);
			setValue('conservations', listining.conservations || []);
			setValue('color', listining.color);
			setValue('financialState', listining.financialState);
			setValue('acceptExchange', listining.acceptExchange);
			setValue('acceptExchangeAmount', listining.acceptExchangeAmount);
			setValue('acceptExchangeChange1', listining.acceptExchangeChange1);
			setValue('acceptExchangeChange2', listining.acceptExchangeChange2);
			setValue('acceptExchangeChange3', listining.acceptExchangeChange3);
			setValue('postalCode', maskPostalCode(listining.postalCode));
			setValue('phone', maskPhone(listining.phone));
			if (listining.description) {
				setValue('description', String(listining.description).toUpperCase());
			}
			setValue(
				'price',
				new Intl.NumberFormat('pt-BR', {
					style: 'currency',
					currency: 'BRL',
				}).format(listining.price),
			);
			setValue('images', listining.photos);
		}
	}, [isSuccess, listining, setValue]);

	return (
		<ScrollView showsVerticalScrollIndicator={false}>
			{/* <Modal isOpen={isLoading}>
				<Modal.Content height={150} alignItems='center' justifyContent='center'>
					<Spinner color={colors.primary} size='lg' />
					<Text
						allowFontScaling={false}
						style={{
							fontSize: 16,
							fontFamily: 'inter_bold',
							color: colors.text,
							marginTop: 20,
						}}
					>
						ANUNCIANDO
					</Text>
				</Modal.Content>
			</Modal> */}
			<View
				style={{
					marginBottom: 5,
					padding: 10,
				}}
			>
				<View style={{ height: 10 }} />
				<Controller
					control={control}
					name='plate'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={plateRef}
								label='PLACA'
								placeholder='AAA0000 - AAA0A00'
								onChangeText={(value) => {
									field.onChange(maskPlate(value.trim()));

									if (value.length === 0) {
										setValue('manufacturer', '');
										setValue('model', '');
										setValue('modelYear', '');
									}

									if (isPlate(value)) {
										toast.dismiss();

										refetchPlate(value);
									}
								}}
								maxLength={8}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										brandRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='manufacturer'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={brandRef}
								label='FABRICANTE'
								placeholder='FABRICANTE'
								onChangeText={field.onChange}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										modelRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='model'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={modelRef}
								label='MODELO'
								placeholder='MODELO'
								onChangeText={field.onChange}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										modelYearRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='modelYear'
					render={({ field, fieldState }) => (
						<View>
							{/* @ts-expect-error */}
							<Input
								{...field}
								ref={modelYearRef}
								label='ANO DO MODELO'
								placeholder='ANO DO MODELO'
								keyboardType='number-pad'
								onChangeText={(value) => field.onChange(value)}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										exchangeRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='exchange'
					render={({ field, fieldState }) => (
						<View>
							<Select
								{...field}
								value={
									field.value
										? {
												value: field.value,
												label: exchanges.find((e) => e.id === field.value)
													?.label as string,
											}
										: undefined
								}
								onValueChange={(value) => field.onChange(value?.value)}
							>
								<SelectTrigger ref={exchangeRef} label='CÂMBIO'>
									<SelectValue placeholder='CÂMBIO' />
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											// top: keyboardHeight,
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{SchemaVehicleExchange.options.map((item) => (
											<SelectItem
												key={item}
												value={item}
												label={
													exchanges.find((e) => e.id === item)?.label as string
												}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='fuel'
					render={({ field, fieldState }) => (
						<View>
							<Select
								{...field}
								value={
									field.value
										? {
												value: field.value,
												label: fuels.find((e) => e.id === field.value)
													?.label as string,
											}
										: undefined
								}
								onValueChange={(value) => field.onChange(value?.value)}
							>
								<SelectTrigger ref={fuelRef} label='COMBUSTÍVEL'>
									<SelectValue placeholder='COMBUSTÍVEL' />
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											// top: keyboardHeight,
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{SchemaMarketplaceVehicleFuel.options.map((item) => (
											<SelectItem
												key={item}
												value={item}
												label={
													fuels.find((e) => e.id === item)?.label as string
												}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='direction'
					render={({ field, fieldState }) => (
						<View>
							<Select
								{...field}
								value={
									field.value
										? {
												value: field.value,
												label: directions.find((e) => e.id === field.value)
													?.label as string,
											}
										: undefined
								}
								onValueChange={(value) => field.onChange(value?.value)}
							>
								<SelectTrigger ref={directionRef} label='DIREÇÃO'>
									<SelectValue placeholder='DIREÇÃO' />
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											// top: keyboardHeight,
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{SchemaMarketplaceVehicleDirection.options.map((item) => (
											<SelectItem
												key={item}
												value={item}
												label={
													directions.find((e) => e.id === item)?.label as string
												}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='km'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								value={String(field.value || '')}
								ref={KMRef}
								label='KILOMETRAGEM'
								placeholder='KILOMETRAGEM'
								keyboardType='number-pad'
								onChangeText={(value) => {
									if (!value) {
										return field.onChange('');
									}

									field.onChange(value);
								}}
								onSubmitEditing={() => {
									Keyboard.dismiss();
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 20 }} />
				<Text
					allowFontScaling={false}
					style={{
						fontSize: 16,
						color: colors.text,
						fontWeight: '700',
						textTransform: 'uppercase',
					}}
				>
					tipo de veículo
				</Text>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 10,
					}}
				>
					<TouchableOpacity
						onPress={() => setValue('type', 'car')}
						style={{
							backgroundColor: type === 'car' ? colors.primary : '#f1f1f1',
							flex: 1,
							paddingHorizontal: 20,
							paddingVertical: 10,
							borderRadius: 5,
							marginTop: 5,
						}}
					>
						<Text
							allowFontScaling={false}
							style={{
								fontWeight: type === 'car' ? '700' : '600',
								textTransform: 'uppercase',
								textAlign: 'center',
								color: type === 'car' ? 'white' : undefined,
							}}
						>
							carro
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setValue('type', 'motorcycle')}
						style={{
							backgroundColor:
								type === 'motorcycle' ? colors.primary : '#f1f1f1',
							flex: 1,
							paddingHorizontal: 20,
							paddingVertical: 10,
							borderRadius: 5,
							marginTop: 5,
						}}
					>
						<Text
							allowFontScaling={false}
							style={{
								fontWeight: type === 'motorcycle' ? '700' : '600',
								textTransform: 'uppercase',
								textAlign: 'center',
								color: type === 'motorcycle' ? 'white' : undefined,
							}}
						>
							moto
						</Text>
					</TouchableOpacity>
				</View>
				<View style={{ height: 30 }} />
				<Text
					allowFontScaling={false}
					style={{
						fontSize: 16,
						color: colors.text,
						fontWeight: '700',
						textTransform: 'uppercase',
					}}
				>
					opcionais
				</Text>
				<View
					style={{
						gap: 10,
						marginTop: 10,
					}}
				>
					{featuresArray.map((item) => (
						<TouchableOpacity
							key={item.id}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'flex-start',
								gap: 10,
							}}
							onPress={() => {
								if (optionals) {
									setValue(
										'optionals',
										// @ts-expect-error
										(optionals.includes(item.id)
											? // @ts-expect-error
												optionals?.filter((x) => x !== item.id)
											: [...optionals, item.id]) || [],
									);
								} else {
									// @ts-expect-error
									setValue('optionals', [item.id]);
								}
							}}
						>
							<View
								style={{
									borderWidth: 1,
									width: 15,
									height: 15,
									borderRadius: 2,
									// @ts-expect-error
									backgroundColor: optionals?.includes(item.id)
										? colors.primary
										: undefined,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{/* @ts-expect-error */}
								{optionals?.includes(item.id) && (
									<Feather name='check' color='white' />
								)}
							</View>
							<Text
								allowFontScaling={false}
								style={{
									fontSize: 15,
									textTransform: 'capitalize',
								}}
							>
								{item.name}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				<View style={{ height: 30 }} />
				<Text
					allowFontScaling={false}
					style={{
						fontSize: 16,
						color: colors.text,
						fontWeight: '700',
						textTransform: 'uppercase',
					}}
				>
					conservação
				</Text>
				<View
					style={{
						gap: 10,
						marginTop: 10,
					}}
				>
					{[
						{
							id: 'only_owner',
							name: 'único dono',
						},
						{
							id: 'with_manual',
							name: 'com manual',
						},
						{
							id: 'extra_key',
							name: 'chave extra',
						},
						{
							id: 'reviewed',
							name: 'revisado na concessionária',
						},
						{
							id: 'with_guarantee',
							name: 'com garantia',
						},
					].map((item) => (
						<TouchableOpacity
							key={item.id}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'flex-start',
								gap: 10,
							}}
							onPress={() => {
								if (conservations) {
									setValue(
										'conservations',
										// @ts-expect-error
										(conservations?.includes(item.id)
											? // @ts-expect-error
												conservations?.filter((x) => x !== item.id)
											: [...conservations, item.id]) || [],
									);
								} else {
									// @ts-expect-error
									setValue('conservations', [item.id]);
								}
							}}
						>
							<View
								style={{
									borderWidth: 1,
									width: 15,
									height: 15,
									borderRadius: 2,
									// @ts-expect-error
									backgroundColor: conservations?.includes(item.id)
										? colors.primary
										: undefined,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{/* @ts-expect-error */}
								{conservations?.includes(item.id) && (
									<Feather name='check' color='white' />
								)}
							</View>
							<Text
								allowFontScaling={false}
								style={{
									fontSize: 15,
									textTransform: 'capitalize',
								}}
							>
								{item.name}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='color'
					render={({ field, fieldState }) => (
						<View>
							<Select
								{...field}
								value={
									field.value
										? {
												value: field.value,
												label: colorsVariable.find((e) => e.id === field.value)
													?.name as string,
											}
										: undefined
								}
								onValueChange={(value) => field.onChange(value?.value)}
							>
								<SelectTrigger ref={colorRef} label='COR'>
									<SelectValue placeholder='COR' />
								</SelectTrigger>
								<SelectContent
									style={{ width: width - 32 }}
									insets={{
										...(keyboardIsVisible && {
											// top: keyboardHeight,
											bottom: keyboardHeight + 24,
										}),
										left: 12,
										right: 12,
									}}
								>
									<NativeSelectScrollView keyboardShouldPersistTaps='always'>
										{SchemaMarketplaceVehicleColor.options.map((item) => (
											<SelectItem
												key={item}
												value={item}
												label={
													colorsVariable.find((e) => e.id === item)
														?.name as string
												}
											/>
										))}
									</NativeSelectScrollView>
								</SelectContent>
							</Select>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Text
					allowFontScaling={false}
					style={{
						fontSize: 16,
						color: colors.text,
						fontWeight: '700',
						textTransform: 'uppercase',
						marginBottom: 10,
					}}
				>
					estado financeiro
				</Text>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 10,
					}}
				>
					{financial_state_array.map((item) => (
						<TouchableOpacity
							key={item.id}
							// @ts-expect-error
							onPress={() => setValue('financialState', item.id)}
							style={{
								backgroundColor:
									financialState === item.id ? colors.primary : '#f1f1f1',
								flex: 1,
								paddingHorizontal: 20,
								paddingVertical: 10,
								borderRadius: 5,
								marginTop: 5,
							}}
						>
							<Text
								allowFontScaling={false}
								style={{
									fontWeight: financialState === item.id ? '700' : '600',
									textTransform: 'uppercase',
									textAlign: 'center',
									color: financialState === item.id ? 'white' : undefined,
								}}
							>
								{item.name}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				<View style={{ height: 30 }} />
				<Text
					allowFontScaling={false}
					style={{
						fontSize: 16,
						color: colors.text,
						fontWeight: '700',
						textTransform: 'uppercase',
						marginBottom: 10,
					}}
				>
					aceita troca?
				</Text>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 10,
					}}
				>
					<TouchableOpacity
						onPress={() => setValue('acceptExchange', true)}
						style={{
							backgroundColor:
								acceptExchange === true ? colors.primary : '#f1f1f1',
							flex: 1,
							paddingHorizontal: 20,
							paddingVertical: 10,
							borderRadius: 5,
							marginTop: 5,
						}}
					>
						<Text
							allowFontScaling={false}
							style={{
								fontWeight: acceptExchange === true ? '700' : '600',
								textTransform: 'uppercase',
								textAlign: 'center',
								color: acceptExchange === true ? 'white' : undefined,
							}}
						>
							sim
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setValue('acceptExchange', false)}
						style={{
							backgroundColor:
								acceptExchange === false ? colors.primary : '#f1f1f1',
							flex: 1,
							paddingHorizontal: 20,
							paddingVertical: 10,
							borderRadius: 5,
							marginTop: 5,
						}}
					>
						<Text
							allowFontScaling={false}
							style={{
								fontWeight: acceptExchange === false ? '700' : '600',
								textTransform: 'uppercase',
								textAlign: 'center',
								color: acceptExchange === false ? 'white' : undefined,
							}}
						>
							somente venda
						</Text>
					</TouchableOpacity>
				</View>
				<View style={{ height: 30 }} />
				{acceptExchange && (
					<Fragment>
						<Text
							allowFontScaling={false}
							style={{
								fontSize: 16,
								color: colors.text,
								fontWeight: '700',
								textTransform: 'uppercase',
								marginBottom: 10,
							}}
						>
							por valor
						</Text>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 10,
							}}
						>
							<TouchableOpacity
								onPress={() => setValue('acceptExchangeAmount', 'down')}
								style={{
									backgroundColor:
										vehicleChangeAmount === 'down' ? colors.primary : '#f1f1f1',
									flex: 1,
									paddingHorizontal: 20,
									paddingVertical: 10,
									borderRadius: 5,
									marginTop: 5,
								}}
							>
								<Text
									allowFontScaling={false}
									style={{
										fontWeight: vehicleChangeAmount === 'down' ? '700' : '600',
										textTransform: 'uppercase',
										textAlign: 'center',
										color: vehicleChangeAmount === 'down' ? 'white' : undefined,
									}}
								>
									por menor valor
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setValue('acceptExchangeAmount', 'up')}
								style={{
									backgroundColor:
										vehicleChangeAmount === 'up' ? colors.primary : '#f1f1f1',
									flex: 1,
									paddingHorizontal: 20,
									paddingVertical: 10,
									borderRadius: 5,
									marginTop: 5,
								}}
							>
								<Text
									allowFontScaling={false}
									style={{
										fontWeight: vehicleChangeAmount === 'up' ? '700' : '600',
										textTransform: 'uppercase',
										textAlign: 'center',
										color: vehicleChangeAmount === 'up' ? 'white' : undefined,
									}}
								>
									por maior valor
								</Text>
							</TouchableOpacity>
						</View>
						<View style={{ height: 20 }} />
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 20,
							}}
						>
							<View
								style={{
									flex: 1,
									height: 1,
									width: '100%',
									backgroundColor: '#d1d1d1',
								}}
							/>
							<Text
								allowFontScaling={false}
								style={{
									fontWeight: 'bold',
									fontSize: 16,
								}}
							>
								OU INFORME SUA PREFERÊNCIA
							</Text>
							<View
								style={{
									flex: 1,
									height: 1,
									width: '100%',
									backgroundColor: '#d1d1d1',
								}}
							/>
						</View>
						<View style={{ height: 20 }} />
						<Controller
							control={control}
							name='acceptExchangeChange1'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || ''}
										ref={vehicleChange1Ref}
										label='MODELO 1'
										autoCapitalize='characters'
										placeholder='EXEMPLO: CELTA LT 2012 A 2014'
										onChangeText={field.onChange}
										onSubmitEditing={() => {
											Keyboard.dismiss();

											setTimeout(() => {
												vehicleChange2Ref.current?.focus();
											}, 100);
										}}
									/>
									{fieldState.invalid && fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<View style={{ height: 30 }} />
						<Controller
							control={control}
							name='acceptExchangeChange2'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || ''}
										ref={vehicleChange1Ref}
										label='MODELO 2'
										autoCapitalize='characters'
										placeholder='EXEMPLO: CELTA LT 2012 A 2014'
										onChangeText={field.onChange}
										onSubmitEditing={() => {
											Keyboard.dismiss();

											setTimeout(() => {
												vehicleChange3Ref.current?.focus();
											}, 100);
										}}
									/>
									{fieldState.invalid && fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<View style={{ height: 30 }} />
						<Controller
							control={control}
							name='acceptExchangeChange3'
							render={({ field, fieldState }) => (
								<View>
									<Input
										{...field}
										value={field.value || ''}
										ref={vehicleChange3Ref}
										label='MODELO 3'
										autoCapitalize='characters'
										placeholder='EXEMPLO: CELTA LT 2012 A 2014'
										onChangeText={field.onChange}
										onSubmitEditing={() => {
											Keyboard.dismiss();

											setTimeout(() => {
												zipCodeRef.current?.focus();
											}, 100);
										}}
									/>
									{fieldState.invalid && fieldState.error?.message && (
										<InputError>{fieldState.error.message}</InputError>
									)}
								</View>
							)}
						/>
						<View style={{ height: 30 }} />
					</Fragment>
				)}
				<Controller
					control={control}
					name='postalCode'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={zipCodeRef}
								label='CEP'
								placeholder='00000-000'
								keyboardType='number-pad'
								returnKeyType='done'
								onChangeText={(value) => field.onChange(maskPostalCode(value))}
								maxLength={9}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										phoneRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='phone'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={phoneRef}
								label='WHATSAPP'
								placeholder='(00) 00000-0000'
								keyboardType='number-pad'
								returnKeyType='done'
								maxLength={15}
								onChangeText={(value) => field.onChange(maskPhone(value))}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										priceRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='price'
					render={({ field, fieldState }) => (
						<View>
							{/* @ts-expect-error */}
							<Input
								{...field}
								ref={priceRef}
								label='PREÇO'
								placeholder='R$ 0.000,00'
								keyboardType='number-pad'
								returnKeyType='done'
								onChangeText={(value) => {
									const digits = value.replace(/\D/g, '');

									const formatted = new Intl.NumberFormat('pt-BR', {
										style: 'currency',
										currency: 'BRL',
									}).format(Number(digits || 0) / 100);

									field.onChange(formatted);
								}}
								onSubmitEditing={() => {
									Keyboard.dismiss();

									setTimeout(() => {
										descriptionRef.current?.focus();
									}, 100);
								}}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<Controller
					control={control}
					name='description'
					render={({ field, fieldState }) => (
						<View>
							<Input
								{...field}
								ref={descriptionRef}
								label='DESCRIÇÃO'
								placeholder='DESCRIÇÃO'
								autoCapitalize='characters'
								className='h-40 py-4'
								multiline
								onChangeText={(value) => field.onChange(value)}
								onSubmitEditing={Keyboard.dismiss}
							/>
							{fieldState.invalid && fieldState.error?.message && (
								<InputError>{fieldState.error.message}</InputError>
							)}
						</View>
					)}
				/>
				<View style={{ height: 30 }} />
				<ImageCarousel
					control={control}
					name='images'
					primaryColor={colors.primary}
					onPickImage={pickImage}
				/>
				<View style={{ height: 30 }} />
				<View
					style={{
						marginBottom: 10,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 10,
					}}
				>
					{id && (
						<Dialog>
							<DialogTrigger asChild>
								<TouchableOpacity
									className='bg-destructive'
									style={{
										flex: 1,
										borderRadius: 5,
										paddingHorizontal: 15,
										paddingVertical: 10,
										alignItems: 'center',
									}}
								>
									<Text
										className='text-white font-bold'
										allowFontScaling={false}
										style={{
											fontSize: 16,
											textTransform: 'uppercase',
										}}
									>
										excluir
									</Text>
								</TouchableOpacity>
							</DialogTrigger>
							<DialogContent className='min-w-full'>
								<DialogHeader>
									<DialogTitle>Deseja excluir o anúncio?</DialogTitle>
									<DialogDescription>
										Ao realizar a ação, não poderá reverter a mesma
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<DialogClose asChild>
										<Button variant='outline'>
											<Text>FECHAR</Text>
										</Button>
									</DialogClose>
									<Button
										variant='destructive'
										disabled={isDeleting}
										onPress={() => deleteItem()}
										className='flex-row items-center justify-center'
									>
										{isDeleting && (
											<ActivityIndicator size='small' color='white' />
										)}
										<Text className='text-white font-bold'>
											{isDeleting ? 'EXCLUINDO' : 'EXCLUIR'}
										</Text>
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					)}
					<TouchableOpacity
						disabled={isPending}
						className={cn(isPending ? 'bg-border' : 'bg-input')}
						style={{
							flex: 1,
							borderRadius: 5,
							paddingHorizontal: 15,
							paddingVertical: 10,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 3,
						}}
						onPress={handleSubmit((props) => sendMarketingPlace(props))}
					>
						{isPending && <ActivityIndicator size='small' color='white' />}
						<Text
							className='text-white font-bold'
							allowFontScaling={false}
							style={{
								fontSize: 16,
								textTransform: 'uppercase',
							}}
						>
							{isPending
								? id
									? 'ATUALIZANDO'
									: 'CADASTRANDO'
								: id
									? 'alterar'
									: 'anunciar'}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
			<View style={{ height: 100 }} />
		</ScrollView>
	);
}

type ImageCarouselProps<T extends FieldValues> = UseControllerProps<T> & {
	onPickImage: () => Promise<ImageAsset | null>;
	primaryColor?: string;
	maxImages?: number;
};

function ImageCarousel<T extends FieldValues>({
	onPickImage,
	primaryColor,
	maxImages = 10,
	...controllerProps
}: ImageCarouselProps<T>) {
	const { width } = useWindowDimensions();
	const scrollRef = useRef<ScrollView>(null);
	const currentIndexRef = useRef(0);

	const IMAGE_WIDTH = width - 30;
	const IMAGE_HEIGHT = 250;

	const {
		field: { value, onChange },
		fieldState: { error },
	} = useController(controllerProps);

	const images: (ImageAsset | string)[] = value ?? [];
	const hasError = !!error;
	const isAtLimit = images.length >= maxImages;

	const handleAdd = async () => {
		if (isAtLimit) return;
		const asset = await onPickImage();
		if (!asset) return;
		const next = [...images, asset];
		onChange(next);
		setTimeout(() => {
			scrollRef.current?.scrollToEnd({ animated: true });
		}, 100);
	};

	const handleRemove = (indexToRemove: number) => {
		const next = images.filter((_, i) => i !== indexToRemove);
		onChange(next.length ? next : []);
		const targetIndex = Math.max(0, indexToRemove - 1);
		setTimeout(() => {
			scrollRef.current?.scrollTo({
				x: targetIndex * IMAGE_WIDTH,
				animated: true,
			});
		}, 50);
	};

	const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetX = e.nativeEvent.contentOffset.x;
		currentIndexRef.current = Math.round(offsetX / IMAGE_WIDTH);
	};

	if (!images.length) {
		return (
			<TouchableOpacity
				onPress={handleAdd}
				activeOpacity={0.7}
				style={[styles.emptyContainer, hasError && styles.emptyContainerError]}
			>
				<Feather
					name='camera'
					size={40}
					color={hasError ? '#EF4444' : '#A1A1AA'}
				/>
				<Text style={[styles.emptyLabel, hasError && styles.emptyLabelError]}>
					Incluir fotos
				</Text>
				<Text style={styles.emptyCounter}>0 de {maxImages} imagens</Text>
				{hasError && <Text style={styles.errorText}>{error?.message}</Text>}
			</TouchableOpacity>
		);
	}

	return (
		<>
			<View style={[styles.carouselWrapper, { height: IMAGE_HEIGHT }]}>
				<ScrollView
					ref={scrollRef}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					onScroll={handleScroll}
					scrollEventThrottle={16}
					decelerationRate='fast'
					snapToInterval={IMAGE_WIDTH}
					snapToAlignment='start'
					style={{ borderRadius: 12 }}
				>
					{images.map((img, i) => (
						<View
							key={i.toString()}
							style={[
								styles.imageSlide,
								{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
							]}
						>
							<Image
								source={{ uri: typeof img === 'string' ? img : img.uri }}
								style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
								contentFit='cover'
								contentPosition='center'
							/>
							<View style={styles.indexBadge}>
								<Text style={styles.indexBadgeText}>
									{i + 1}/{images.length}
								</Text>
							</View>
							<TouchableOpacity
								style={styles.removeButton}
								onPress={() => handleRemove(i)}
								activeOpacity={0.8}
							>
								<Feather name='trash-2' size={16} color='#EF4444' />
							</TouchableOpacity>
						</View>
					))}
				</ScrollView>
			</View>
			<View style={styles.metaRow}>
				<Text style={styles.counter}>
					{images.length} de {maxImages} imagens
				</Text>
				{hasError && <Text style={styles.errorText}>{error?.message}</Text>}
			</View>
			<TouchableOpacity
				onPress={handleAdd}
				disabled={isAtLimit}
				activeOpacity={0.8}
				style={[
					styles.addButton,
					{ backgroundColor: isAtLimit ? '#A1A1AA' : primaryColor },
				]}
			>
				<Feather
					name='plus'
					size={18}
					color='white'
					style={{ marginRight: 6 }}
				/>
				<Text style={styles.addButtonText}>ADICIONAR IMAGEM</Text>
			</TouchableOpacity>
		</>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		borderWidth: 1.5,
		borderColor: 'hsl(0 0% 9%)',
		borderStyle: 'dashed',
		borderRadius: 12,
		height: 250,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginBottom: 10,
	},
	emptyContainerError: {
		borderColor: '#EF4444',
	},
	emptyLabel: {
		fontSize: 15,
		fontWeight: '500',
		color: '#52525B',
		textTransform: 'capitalize',
	},
	emptyLabelError: {
		color: '#EF4444',
	},
	emptyCounter: {
		fontSize: 12,
		color: '#A1A1AA',
	},
	carouselWrapper: {
		borderRadius: 12,
		overflow: 'hidden',
		marginBottom: 8,
	},
	imageSlide: {
		height: 250,
		backgroundColor: '#F4F4F5',
	},
	removeButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		zIndex: 10,
		backgroundColor: 'white',
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.12,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	arrow: {
		position: 'absolute',
		zIndex: 10,
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		top: 250 / 2 - 16,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	arrowLeft: {
		left: -12,
	},
	arrowRight: {
		right: -12,
	},
	dotsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 5,
		marginBottom: 6,
	},
	dot: {
		height: 6,
		width: 6,
		borderRadius: 3,
	},
	metaRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 10,
		paddingHorizontal: 2,
	},
	counter: {
		fontSize: 12,
		color: '#A1A1AA',
	},
	errorText: {
		fontSize: 12,
		color: '#EF4444',
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 6,
		marginBottom: 10,
	},
	addButtonText: {
		color: 'white',
		fontSize: 14,
		fontWeight: '600',
		letterSpacing: 0.5,
	},
	indexBadge: {
		position: 'absolute',
		bottom: 8,
		left: 8,
		backgroundColor: 'rgba(0,0,0,0.45)',
		borderRadius: 20,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	indexBadgeText: {
		color: 'white',
		fontSize: 12,
		fontWeight: '600',
	},
});
