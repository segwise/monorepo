import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toast';
import {
	useMarketplaceVehicleDelete,
	useMyMarketplaceVehicles,
} from '@/libraries/hooks/api/marketplace/vehicles';
import { storage } from '@/libraries/storage';
import { maskPlate } from '@segwise/core/masks';
import type {
	MarketplaceVehicle,
	MarketplaceVehicleRegisterForm,
} from '@segwise/core/types';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Fragment, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
	Text,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_MAP = {
	active: {
		label: 'ATIVO',
		className: 'bg-green-100',
		textClassName: 'text-green-700',
	},
	sold: {
		label: 'VENDIDO',
		className: 'bg-gray-100',
		textClassName: 'text-gray-500',
	},
	paused: {
		label: 'PAUSADO',
		className: 'bg-yellow-100',
		textClassName: 'text-yellow-700',
	},
};

function StatusBadge({ status }: { status: MarketplaceVehicle['status'] }) {
	const config = STATUS_MAP[status] ?? STATUS_MAP.active;
	return (
		<View className={`px-2 py-0.5 rounded-full ${config.className}`}>
			<Text
				allowFontScaling={false}
				className={`text-xs font-bold ${config.textClassName}`}
			>
				{config.label}
			</Text>
		</View>
	);
}

interface MyVehicleCardProps {
	item: MarketplaceVehicleRegisterForm;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

function MyVehicleCard({ item, onEdit, onDelete }: MyVehicleCardProps) {
	const formatCurrency = (value: number) =>
		value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
	const formatMileage = (value: number) =>
		`${value.toLocaleString('pt-BR')} km`;

	return (
		<View className='bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm'>
			<View className='w-full h-44 bg-gray-100'>
				{item.photos[0] ? (
					<Image
						source={{ uri: item.photos[0] as string }}
						className='w-full h-full'
						resizeMode='cover'
					/>
				) : (
					<View className='flex-1 items-center justify-center'>
						<SymbolView
							name={{ ios: 'car.fill', android: 'directions_car' }}
							size={48}
							tintColor='#D1D5DB'
						/>
					</View>
				)}
				<View className='absolute top-3 right-3'>
					{/* @ts-expect-error */}
					<StatusBadge status={item.status} />
				</View>
			</View>
			<View className='px-4 pt-3 pb-2 gap-y-1'>
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
				<View className='flex-row items-center gap-x-3 mt-1'>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{ ios: 'gauge.medium', android: 'speed' }}
							size={13}
							tintColor='#9CA3AF'
						/>
						<Text allowFontScaling={false} className='text-xs text-gray-400'>
							{formatMileage(item.mileage)}
						</Text>
					</View>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{
								ios: 'rectangle.and.text.magnifyingglass',
								android: 'pin',
							}}
							size={13}
							tintColor='#9CA3AF'
						/>
						<Text
							allowFontScaling={false}
							className='text-xs text-gray-400 uppercase'
						>
							{maskPlate(item.plate)}
						</Text>
					</View>
					<View className='flex-row items-center gap-x-1'>
						<SymbolView
							name={{ ios: 'mappin.circle.fill', android: 'location_on' }}
							size={13}
							tintColor='#9CA3AF'
						/>
						<Text
							allowFontScaling={false}
							className='text-xs text-gray-400'
							numberOfLines={1}
						>
							{item.city.toString()}
						</Text>
					</View>
				</View>
			</View>
			<Separator className='mx-4' />
			<View className='flex-row'>
				<Pressable
					// @ts-expect-error
					onPress={() => onEdit(item.id)}
					className='flex-1 flex-row items-center justify-center gap-x-2 py-3 active:bg-gray-50'
				>
					<SymbolView
						name={{ ios: 'pencil', android: 'edit' }}
						size={16}
						tintColor='#6B7280'
					/>
					<Text
						allowFontScaling={false}
						className='text-sm font-semibold text-gray-600'
					>
						Editar
					</Text>
				</Pressable>
				<View className='w-px bg-gray-100' />
				<Pressable
					// @ts-expect-error
					onPress={() => onDelete(item.id)}
					className='flex-1 flex-row items-center justify-center gap-x-2 py-3 active:bg-red-50'
				>
					<SymbolView
						name={{ ios: 'trash', android: 'delete' }}
						size={16}
						tintColor='#EF4444'
					/>
					<Text
						allowFontScaling={false}
						className='text-sm font-semibold text-red-500'
					>
						Remover
					</Text>
				</Pressable>
			</View>
		</View>
	);
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
	return (
		<View className='flex-1 items-center justify-center gap-y-4 py-24 px-8'>
			<SymbolView
				name={{ ios: 'car.fill', android: 'directions_car' }}
				size={56}
				tintColor='#D1D5DB'
			/>
			<Text
				allowFontScaling={false}
				className='text-base font-semibold text-gray-400 text-center'
			>
				Você ainda não cadastrou{'\n'}nenhum veículo.
			</Text>
			<Button onPress={onAdd} className='h-11 px-6'>
				<Text className='text-sm text-white font-semibold'>
					CADASTRAR VEÍCULO
				</Text>
			</Button>
		</View>
	);
}

function MyMarketplaceVehicles() {
	const { push } = useRouter();

	const { bottom } = useSafeAreaInsets();

	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

	const { data: vehicles, isLoading } = useMyMarketplaceVehicles({
		limit: 100,
		registration: storage.getString('buying-and-selling') as string,
	});

	const { mutate: deleteVehicle, isPending: isDeleting } =
		useMarketplaceVehicleDelete();

	function handleDelete() {
		if (!deleteTargetId) {
			return;
		}

		deleteVehicle(
			{ id: deleteTargetId },
			{
				onSuccess() {
					setDeleteTargetId(null);

					toast.success('Veículo removido com sucesso.');
				},
				onError(error) {
					toast.error(error.message, { id: 'delete-vehicle' });
				},
			},
		);
	}

	return (
		<Fragment>
			<View className='flex-1 bg-gray-50'>
				{isLoading ? (
					<View className='flex-1 items-center justify-center'>
						<ActivityIndicator size='large' />
					</View>
				) : (
					<FlatList
						data={vehicles?.data}
						keyExtractor={(item) => item.id}
						renderItem={({ item }) => (
							<MyVehicleCard
								// @ts-expect-error
								item={item}
								onEdit={(id) =>
									push(`/(stacks)/(buying-and-selling)/vehicle-edit?id=${id}`)
								}
								onDelete={(id) => setDeleteTargetId(id)}
							/>
						)}
						ListEmptyComponent={
							<EmptyState
								onAdd={() =>
									push('/(stacks)/(buying-and-selling)/vehicle-register')
								}
							/>
						}
						ListHeaderComponent={() => (
							<Button
								onPress={() =>
									push('/(stacks)/(buying-and-selling)/vehicle-register')
								}
								hitSlop={8}
							>
								<Text className='text-white font-bold'>CADASTRAR VEÍCULO</Text>
							</Button>
						)}
						contentContainerStyle={{
							paddingHorizontal: 16,
							paddingTop: 16,
							paddingBottom: bottom + 24,
							gap: 12,
							flexGrow: 1,
						}}
						showsVerticalScrollIndicator={false}
					/>
				)}
			</View>
			<Dialog
				open={!!deleteTargetId}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTargetId(null);
					}
				}}
			>
				<DialogContent showClose={false}>
					<DialogHeader className='gap-3'>
						<View className='items-center justify-center'>
							<View className='bg-red-100 rounded-full size-14 items-center justify-center'>
								<SymbolView
									name={{ ios: 'trash.fill', android: 'delete' }}
									size={28}
									tintColor='#EF4444'
								/>
							</View>
						</View>
						<DialogTitle className='text-lg text-center font-bold'>
							Remover Veículo?
						</DialogTitle>
						<DialogDescription className='text-sm text-center text-gray-500'>
							Essa ação não pode ser desfeita. O veículo será removido do
							marketplace permanentemente.
						</DialogDescription>
						<View className='flex-row gap-x-3 mt-2'>
							<Button
								variant='outline'
								className='flex-1 h-11'
								onPress={() => setDeleteTargetId(null)}
								disabled={isDeleting}
							>
								<Text className='text-sm font-semibold text-gray-700'>
									CANCELAR
								</Text>
							</Button>
							<Button
								className='flex-1 h-11 bg-red-500'
								onPress={handleDelete}
								disabled={isDeleting}
							>
								{isDeleting ? (
									<ActivityIndicator color='#FFFFFF' />
								) : (
									<Text className='text-sm font-semibold text-white'>
										REMOVER
									</Text>
								)}
							</Button>
						</View>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</Fragment>
	);
}

export default MyMarketplaceVehicles;
