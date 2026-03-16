import { Linking, Text, TouchableOpacity, View } from 'react-native';

function MainDriver() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Exemplo:
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Quando mais de uma pessoa utilizar o veículo segurado mais de um dia
					da semana:{`\n\n`}
				</Text>
				<Text allowFontScaling={false} accessible={false}>
					O segurado deverá informar como o principal condutor a pessoa mais
					jovem que utiliza o veículo.
					{`\n\n`}
				</Text>
				<Text allowFontScaling={false} accessible={false}>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						Observação:
					</Text>{' '}
					<Text allowFontScaling={false} accessible={false}>
						A definição do principal condutor do veículo segurado é fundamental
						para que não haja negativa no pagamento da indenização.
					</Text>
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-center font-bold mt-4 leading-tight'
				style={{
					textDecorationLine: 'underline',
				}}
			>
				Dúvidas, fale com o seu corretor
			</Text>
		</View>
	);
}

function OvernightPostalCode() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Exemplo:
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Se o veículo segurado pernoita em vários locais durante o mês:
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-left font-bold leading-tight mt-4'
			>
				Definir como CEP de pernoite o local onde o veículo passa a maior parte
				do tempo.
			</Text>
		</View>
	);
}

function CoverageForDriversBetween18And25YearsOfAge() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Deseja contratar uma cobertura para condutores na faixa etária de 18 a
				25 anos de idade?
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					Se a resposta for - SIM
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Esta pergunta define apenas uma cobertura especial, esporádica para no
					máximo 1 dia por semana para condutores nessa faixa etária.
					{`\n`}
				</Text>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='text-xs font-semibold'
				>
					( Algumas seguradoras permitem até 2 dias por semana )
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-left font-bold leading-tight mt-4'
			>
				Se várias pessoas utilizarem o veículo mais de um dia na semana, o
				segurado deverá informar como principal condutor a pessoa mais jovem.
			</Text>
		</View>
	);
}

function DutiesOfTheInsured() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight mb-1'
			>
				Atenção:
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					É obrigatório o preenchimento correto das informações, cuja veracidade
					é de inteira responsabilidade do segurado.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Se houver divergência nas informações de risco contidas na
					proposta/apólice:
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					O segurado deverá informar tal situação imediatamente a
					corretora/seguradora
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Se no decorrer da vigência da apólice houver mudança de:
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Principal condutor
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Troca de veículo
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- Utilização do veículo
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						- CEP de pernoite
					</Text>
					{`\n\n`}É obrigação do segurado comunicar e solicitar a alteração do
					risco a corretora/seguradora
					{`\n\n`}
					Informações inverídicas ou desatualizadas poderão acarretar a perda de
					direito do segurado e cancelamento do seguro.
					{`\n\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						ARTIGO 765/766 do código civil brasileiro:
					</Text>
					{`\n`}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='font-bold'
					>
						Se em um eventual sinistro for verificada divergências entre o risco
						aceito e o contratado, o segurado perderá o direito as garantias
						contratadas.
					</Text>
				</Text>
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base text-center font-bold leading-tight mt-4'
				style={{
					textDecorationLine: 'underline',
				}}
			>
				Seguro, só com o corretor de seguros
			</Text>
		</View>
	);
}

function PolicyRefusal() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='font-bold text-lg leading-tight'
				style={{
					marginBottom: 16,
				}}
			>
				A aceitação da proposta de seguro está sujeita a análise do risco.
			</Text>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					A proposta poderá ser recusada pela seguradora em até 15 dias contados
					a partir da data do seu recebimento.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					A eventual recusa e os motivos da mesma, serão informados ao segurado
					por meio de e-mail, enviado ao endereço eletrônico constatado na
					proposta de seguro.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Se tiver ocorrido pagamento de prêmio, os valores serão devolvidos,
					integralmente no prazo máximo de 10(dez) dias corridos.
				</Text>
				{`\n\n`}
				<Text allowFontScaling={false} accessible={false}>
					Decorrido o prazo de 15(quize) dias da recepção da proposta sem que
					haja manifestação da seguradora, ficará caracterizada a aceitação do
					risco.
				</Text>
			</Text>
		</View>
	);
}

function PolicyValidity() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text>
					Os seguros terão início e término de vigência as 24(vinte e quatro)
					horas das datas indicadas no campo{' '}
					<Text
						allowFontScaling={false}
						accessible={false}
						className='uppercase font-bold'
					>
						vigência
					</Text>{' '}
					de cada proposta.
				</Text>
			</Text>
		</View>
	);
}

function RegistrationStatus() {
	return (
		<View>
			<Text
				allowFontScaling={false}
				accessible={false}
				className='text-base leading-tight'
			>
				<Text allowFontScaling={false} accessible={false}>
					O segurado poderá consultar a situação cadastral do corretor de
					seguros e da sociedade seguradora no site:
				</Text>
			</Text>
			<TouchableOpacity
				className='mt-1'
				onPress={() => Linking.openURL('https://susep.gov.br')}
			>
				<Text
					allowFontScaling={false}
					accessible={false}
					className='font-bold text-sm uppercase'
					style={{
						textDecorationLine: 'underline',
					}}
				>
					www.susep.gov.br
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const requiredReading = {
	'main-driver': {
		title: 'Principal Condutor',
		content: <MainDriver />,
	},
	'overnight-postal-code': {
		title: 'CEP de Pernoite',
		content: <OvernightPostalCode />,
	},
	'coverage-for-drivers-between-18-and-25-years-of-age': {
		title: 'Cobertura para Condutores Entre 18 e 25 Anos de Idade',
		content: <CoverageForDriversBetween18And25YearsOfAge />,
	},
	'duties-of-the-insured': {
		title: 'Deveres do Segurado',
		content: <DutiesOfTheInsured />,
	},
	'policy-refusal': {
		title: 'Recusa da Apólice',
		content: <PolicyRefusal />,
	},
	'policy-validity': {
		title: 'Vigência da Apólice',
		content: <PolicyValidity />,
	},
	'registration-status': {
		title: 'Situação Cadastral',
		content: <RegistrationStatus />,
	},
};

export { requiredReading };
