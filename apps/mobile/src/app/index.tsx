import LOGO from '@/assets/images/logo/segwise.png';
import BACKGROUND_MAP from '@/assets/images/splash-screen/background-map.png';
import { cn } from '@/libraries/classname';
import { storage } from '@/libraries/storage';
import { Image, ImageBackground } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

function IndexScreen() {
	const { width, height } = useWindowDimensions();

	const { replace } = useRouter();

	const navigation = useCallback(() => {
		const storeReferral = storage.getString('referral');

		replace(!storeReferral ? '/(stacks)/request-referral' : '/(stacks)/home');
	}, [replace]);

	useEffect(() => {
		setTimeout(() => {
			navigation();
		}, 3000);
	}, [navigation]);

	return (
		<View className='bg-primary size-full'>
			<ImageBackground
				source={BACKGROUND_MAP}
				contentFit='contain'
				contentPosition='center'
				style={{
					width,
					height,
				}}
				allowDownscaling={false}
				accessible={false}
			>
				<View className='flex flex-col items-center justify-between py-10 absolute inset-0 z-10 size-full'>
					<View />
					<Image
						source={LOGO}
						contentFit='contain'
						contentPosition='center'
						style={{
							width,
							height: width / 10,
						}}
						allowDownscaling={false}
						accessible={false}
						priority='high'
					/>
					<View />
					<Text
						allowFontScaling={false}
						className={cn(
							'text-base text-white text-center absolute bottom-10',
							width <= 400 && 'bottom-0',
						)}
					>
						Todos os Direitos Reservados
					</Text>
				</View>
				<View
					className={cn(
						'absolute inset-0 z-0 pb-52 items-center justify-center',
						width <= 400 && 'pb-[10.5rem]',
					)}
				>
					<Svg width={width} height={height} viewBox='0 0 430 603' fill='none'>
						<Circle
							opacity='0.57'
							cx='216'
							cy='401'
							r='71.5'
							stroke='#FFFFFF'
						/>
						<Circle
							opacity='0.4'
							cx='216'
							cy='401'
							r='120.5'
							stroke='white'
							strokeOpacity='0.7'
						/>
						<G filter='url(#filter0_f_0_1)'>
							<Circle
								cx='216'
								cy='401'
								r='169.5'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
						<G filter='url(#filter1_f_0_1)'>
							<Circle
								cx='216'
								cy='401'
								r='228.5'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
						<G filter='url(#filter2_f_0_1)'>
							<Circle
								cx='215.5'
								cy='400.5'
								r='297'
								stroke='white'
								strokeOpacity='0.2'
							/>
						</G>
					</Svg>
				</View>
			</ImageBackground>
		</View>
	);
}

export default IndexScreen;
