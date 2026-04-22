import LOGO from '@/assets/images/logo/segwise.png';
import { cn } from '@/libraries/classname';
import { storage } from '@/libraries/storage';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps extends NativeStackHeaderProps {
	titlePosition?: 'left' | 'center' | 'right';
	showReturn?: boolean;
}

function Header({
	titlePosition = 'center',
	showReturn = true,
	options: { title },
	...props
}: HeaderProps) {
	const { width } = useWindowDimensions();
	const { top } = useSafeAreaInsets();

	// @ts-expect-error
	const firstInit = props.route.params?.['first-init'];

	const { back, replace } = useRouter();

	return (
		<View>
			<View className='bg-primary' style={{ height: top }} />
			<View
				className={cn(
					'bg-primary flex-row items-center justify-center py-2 px-4',
					showReturn && 'justify-between',
				)}
			>
				{props.route.name === 'request-referral' ? (
					<View className={cn('size-6', width <= 400 && 'size-8')} />
				) : !firstInit && showReturn ? (
					<TouchableOpacity
						onPress={back}
						hitSlop={14}
						className={cn('size-6', width <= 400 && 'size-8')}
					>
						<SymbolView
							name={{
								ios: 'chevron.left',
								android: 'chevron_left',
							}}
							size={width <= 400 ? 32 : 24}
							tintColor='#FFFFFF'
						/>
					</TouchableOpacity>
				) : (
					showReturn && (
						<View className={cn('size-6', width <= 400 && 'size-8')} />
					)
				)}
				<Image
					source={LOGO}
					style={{
						width: 170,
						height: 50,
					}}
					contentFit='contain'
					alt='Logo'
					cachePolicy='memory-disk'
					contentPosition='center'
					priority='high'
					placeholderContentFit='contain'
					allowDownscaling={false}
					accessible={false}
				/>
				{props.route.name === 'request-referral' ? (
					<TouchableOpacity
						onPress={() => {
							replace('/(stacks)/home');

							storage.set('first-view', true);
						}}
						hitSlop={14}
						className={cn('size-6', width <= 400 && 'size-8')}
					>
						<SymbolView
							name={{
								ios: 'x.circle.fill',
								android: 'close',
							}}
							size={32}
							tintColor='#FFFFFF'
						/>
					</TouchableOpacity>
				) : (
					showReturn && (
						<View className={cn('size-6', width <= 400 && 'size-8')} />
					)
				)}
			</View>
			<View
				className={cn(
					'bg-primary py-2 border-t border-t-white px-4 flex flex-row items-center justify-between',
					showReturn && 'justify-center',
				)}
			>
				<Text
					allowFontScaling={false}
					className={cn(
						'text-lg font-semibold text-white uppercase line-clamp-1',
						titlePosition === 'left' && 'text-left',
						titlePosition === 'center' && 'text-center',
						titlePosition === 'right' && 'text-right',
					)}
				>
					{title}
				</Text>
			</View>
		</View>
	);
}

export { Header };
