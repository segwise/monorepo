import { ButtonGrid } from '@/containers/home/button-grid';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

function UsefulContactsScreen() {
	return (
		<View className='p-4 flex-row flex-wrap gap-2'>
			<View className='flex-1 min-w-[28%]'>
				<ButtonGrid
					title='Seguradoras'
					icon={({ width, height, className, style }) => (
						<Svg
							width={width || 77}
							height={height || 77}
							viewBox='0 0 24 24'
							fill='none'
							className={className}
							style={style}
						>
							<Path
								d='M10.49 2.23006L5.50003 4.10005C4.35003 4.53005 3.41003 5.89004 3.41003 7.12004V14.55C3.41003 15.73 4.19005 17.28 5.14005 17.99L9.44003 21.2001C10.85 22.2601 13.17 22.2601 14.58 21.2001L18.88 17.99C19.83 17.28 20.61 15.73 20.61 14.55V7.12004C20.61 5.89004 19.67 4.53005 18.52 4.10005L13.53 2.23006C12.68 1.92006 11.32 1.92006 10.49 2.23006Z'
								stroke='currentColor'
								strokeWidth={1}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<Path
								d='M12.0001 10.92C11.9601 10.92 11.9101 10.92 11.8701 10.92C10.9301 10.89 10.1801 10.11 10.1801 9.16003C10.1801 8.19003 10.9701 7.40002 11.9401 7.40002C12.9101 7.40002 13.7001 8.19003 13.7001 9.16003C13.6901 10.12 12.9401 10.89 12.0001 10.92Z'
								stroke='currentColor'
								strokeWidth={1}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
							<Path
								d='M10.01 13.72C9.05004 14.36 9.05004 15.41 10.01 16.05C11.1 16.78 12.89 16.78 13.98 16.05C14.94 15.41 14.94 14.36 13.98 13.72C12.9 12.99 11.11 12.99 10.01 13.72Z'
								stroke='currentColor'
								strokeWidth={1}
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</Svg>
					)}
					href='/(stacks)/(useful-contacts)/(insurance-companies)'
				/>
			</View>
			<View className='flex-1 min-w-[28%]'>
				<ButtonGrid
					title='Emergência'
					icon={({ width, height, className, style }) => (
						<Svg
							width={width || 77}
							height={height || 77}
							viewBox='0 0 24 24'
							fill='none'
							className={className}
							style={style}
						>
							<Path
								d='M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C21.4816 7.82475 21.7706 8.69989 21.8985 10M22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22878 22 4.34314 22 3.17157 20.8284C2.51839 20.1752 2.22937 19.3001 2.10149 18'
								stroke='currentColor'
								strokeWidth={1}
								strokeLinecap='round'
							/>
							<Path
								d='M16 6C16 4.11438 16 3.17157 15.4142 2.58579C14.8284 2 13.8856 2 12 2C10.1144 2 9.17157 2 8.58579 2.58579C8 3.17157 8 4.11438 8 6'
								stroke='currentColor'
								strokeWidth={1}
							/>
							<Path
								d='M13.5 14H10.5M12 12.5V15.5'
								stroke='currentColor'
								strokeWidth={1}
								strokeLinecap='round'
							/>
							<Circle
								cx='12'
								cy='14'
								r='4'
								stroke='currentColor'
								strokeWidth={1}
							/>
						</Svg>
					)}
					href='/(stacks)/(useful-contacts)/emergency'
				/>
			</View>
		</View>
	);
}

export default UsefulContactsScreen;
