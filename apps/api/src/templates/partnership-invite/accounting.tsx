import {
	Body,
	Column,
	Font,
	Head,
	Html,
	Img,
	pixelBasedPreset,
	Row,
	Section,
	Tailwind,
	Text,
} from 'react-email';

const LOGO_WHITE = 'https://cdn.segwise.com.br/images-public/Group%2077.svg';

const partnerInsurers = [
	{
		name: 'porto seguro',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/porto-seguro-logo-1024x306.png',
	},
	{
		name: 'allianz',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-QN2R1vV-4DFVXc4G20kUF11Rsocijhji7WDsk1vNLg&s=10',
	},
	{
		name: 'tokio marine',
		logo: 'https://brinfinite.com.br/wp-content/uploads/2022/11/logo-tokio-marine-seguradora-1024-copia.png',
	},
	{
		name: 'mapfre',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mapfre_logo.svg/500px-Mapfre_logo.svg.png?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=thumbnail',
	},
	{
		name: 'azul',
		logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Logotipo_da_Azul_Seguros.svg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
	},
	{
		name: 'bradesco seguros',
		logo: 'https://www.seguroauto.org/wp-content/themes/SA2023/images/logo_seguradora_bradesco_seguro.webp',
	},
	{
		name: 'hdi',
		logo: 'https://vamosescrever.com.br/assets/img/clients/hdi.png',
	},
	{
		name: 'itaú seguros',
		logo: 'https://vectorseek.com/wp-content/uploads/2023/09/Itau-Seguros-Logo-Vector.svg-.png',
	},
	{
		name: 'yelum',
		logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXpFdG03G9WEJl1azWKr9g_PrxNhlo6LbN7jNE7_3kBbFXXHn8WhjbOUA&s=10',
	},
	{
		name: 'suhai',
		logo: 'https://seguros.ababas.com.br/wp-content/uploads/2023/05/suhai.png',
	},
	{
		name: 'ezze seguros',
		logo: 'https://mo4web.com.br/wp-content/uploads/2025/06/B.png',
	},
	{
		name: 'aliro seguro',
		logo: 'https://cdn.dealerspace.ai/lider/aquila-seguros/conteudo-online/seguradoras/aliro-seguro.png',
	},
	{
		name: 'mitsui sumitomo',
		logo: 'https://neonseguros.com.br/wp-content/uploads/2024/06/Logo-Mitsui-Sumitomo.png',
	},
	{
		name: 'novo seguros',
		logo: 'https://www.gruporesenderibeiro.com.br/logos/novo-seguros.png',
	},
	{
		name: 'usebens',
		logo: 'https://parceiro.usebens.com.br/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flogo-usebens-login-filled.de22e6d8.png&w=750&q=75',
	},
	{
		name: 'justos seguros',
		logo: 'https://cdn.prod.website-files.com/63bdbbd2c764e85f370a866e/65b0678c2788500d8aaf36ee_justons-new-black.svg',
	},
];

// Tabelas em vez de CSS grid: e-mail não suporta grid de forma confiável.
// Quebramos os logos em linhas de 8 colunas usando Row/Column (base <table>).
const INSURERS_PER_ROW = 8;

function InsurerLogoGrid() {
	const rows: (typeof partnerInsurers)[] = [];
	for (let i = 0; i < partnerInsurers.length; i += INSURERS_PER_ROW) {
		rows.push(partnerInsurers.slice(i, i + INSURERS_PER_ROW));
	}

	return (
		<>
			{rows.map((row, rowIndex) => (
				// eslint-disable-next-line react/no-array-index-key
				<Row key={`insurer-row-${rowIndex}`} className="mt-1">
					{row.map((insurer) => (
						<Column
							key={insurer.name}
							className="border border-solid border-[#E5E7EB] rounded py-1 px-1 align-middle"
						>
							<Img
								src={insurer.logo}
								alt={insurer.name}
								width={40}
								height={15}
								className="object-contain mx-auto"
							/>
						</Column>
					))}
				</Row>
			))}
		</>
	);
}

function TemplatePartnershipInviteAccounting({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL(
		'https://segwise.com.br/gestao-protecao-contabilidade',
	);
	if (leadId) urlMessage.searchParams.set('leadId', leadId);

	return (
		<Html lang="pt-BR">
			<Head>
				<title>Gestão + Proteção — Escritório de Contabilidade | XCAR</title>
				<Font
					fontFamily="Inter"
					fallbackFontFamily="Arial"
					webFont={{
						url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
						format: 'woff2',
					}}
					fontWeight={400}
					fontStyle="normal"
				/>
				<style>{`
					@media print {
						* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				`}</style>
			</Head>
			<Tailwind
				config={{
					presets: [pixelBasedPreset],
					theme: {
						extend: {
							colors: {
								primary: '#09090b',
								primaryDark: '#FF6900',
								surface: '#F4F6FB',
								muted: '#6B7280',
							},
						},
					},
				}}
			>
				<Body
					className="bg-white m-0"
					style={{ fontFamily: 'Inter, Arial, sans-serif' }}
				>
					<Section className="mx-auto max-w-[680px]">
						<Section className="bg-primary px-10 py-4">
							<Row>
								<Column>
									<Img
										src={LOGO_WHITE}
										alt="XCAR CORRETORA DE SEGUROS"
										width={120}
										height={27}
									/>
								</Column>
								<Column align="right">
									<Text className="text-[10px] tracking-wide text-[#9CA3AF] uppercase m-0">
										Proposta de parceria comercial
									</Text>
								</Column>
							</Row>
						</Section>

						<Section className="px-10 pt-5 pb-5">
							<Text className="text-[11px] text-[#374151] text-right m-0 mb-5">
								Recife, ____ de __________________ de 2026.
							</Text>
							<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								Ao(À) Sr.(a) Responsável por Novos Negócios
							</Text>
							<Text className="text-[11px] text-[#374151] m-0 mb-0.5">
								(Contador(a) / Escritório de Contabilidade)
							</Text>
							<Text className="text-[11px] text-[#374151] m-0 mb-4">
								Prezado(a) Senhor(a),
							</Text>

							<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
								Uma excelente oportunidade para ampliar os benefícios oferecidos
								aos clientes sob a gestão de sua empresa.
							</Text>

							<Text className="text-[12px] font-bold text-primary m-0 mb-1.5">
								PROTEÇÃO AO PATRIMÔNIO
							</Text>
							<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-3">
								Seu cliente, seja proprietário de uma pequena, média ou grande
								empresa, atuando nos segmentos de comércio, serviços ou
								indústria, está exposto diariamente a diversos riscos que podem
								comprometer seu patrimônio, suas operações e até mesmo a
								continuidade de suas atividades. Por isso, contar com uma
								proteção adequada é fundamental para reduzir impactos
								financeiros e preservar o negócio.
							</Text>
							<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
								Meu nome é Fernando Luiz Malheiros de Sena, Diretor da XCAR
								Corretora de Seguros, e gostaria de apresentar, em parceria com
								seu escritório, o programa "GESTÃO + PROTEÇÃO", criado para
								agregar valor aos serviços contábeis e oferecer aos seus
								clientes acesso a soluções de proteção patrimonial e seguros.
							</Text>

							<Section className="mb-4">
								<Text className="text-[12px] font-bold text-primary m-0 mb-1.5">
									1. BENEFÍCIOS AOS CLIENTES
								</Text>
								<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
									Acesso ao aplicativo Segwise
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
									Um aplicativo relevante e de fácil utilização, desenvolvido
									para ampliar os benefícios já oferecidos por sua empresa,
									funcionando como um verdadeiro assistente de bolso e
									centralizando serviços, informações e orientações essenciais,
									tais como:
								</Text>

								<Row className="mb-1">
									<Column width={16} className="align-top">
										<Text className="text-[11px] text-[#9CA3AF] leading-[16px] m-0">
											•
										</Text>
									</Column>
									<Column className="align-top">
										<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
											<b>EVITAR NEGATIVA DE SINISTRO</b> – orientações sobre
											temas como principal condutor, CEP de pernoite, cobertura
											para condutores entre 18 e 25 anos, deveres do segurado,
											situações que podem ocasionar recusa de cobertura, entre
											outros.
										</Text>
									</Column>
								</Row>
								<Row className="mb-1">
									<Column width={16} className="align-top">
										<Text className="text-[11px] text-[#9CA3AF] leading-[16px] m-0">
											•
										</Text>
									</Column>
									<Column className="align-top">
										<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
											<b>CONSULTA VEICULAR</b> – informações sobre valor médio
											da FIPE, multas, gravames, infrações, débitos, IPVA,
											licenciamento, DPVAT, roubo e sinistros.
										</Text>
									</Column>
								</Row>
								<Row className="mb-1">
									<Column width={16} className="align-top">
										<Text className="text-[11px] text-[#9CA3AF] leading-[16px] m-0">
											•
										</Text>
									</Column>
									<Column className="align-top">
										<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
											<b>ASSISTÊNCIAS</b> – telefones e orientações para
											solicitar reboque, comunicar um sinistro, solicitar
											substituição de vidros, faróis e lanternas, entre outros
											serviços.
										</Text>
									</Column>
								</Row>
								<Row>
									<Column width={16} className="align-top">
										<Text className="text-[11px] text-[#9CA3AF] leading-[16px] m-0">
											•
										</Text>
									</Column>
									<Column className="align-top">
										<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
											<b>ORIENTAÇÃO EM CASO DE SINISTRO</b> – informações sobre
											como agir, para onde ligar, quais providências tomar e
											como proceder em situações que envolvam vítimas.
										</Text>
									</Column>
								</Row>
							</Section>

							<Section className="mb-4">
								<Text className="text-[12px] font-bold text-primary m-0 mb-1.5">
									2. BENEFÍCIOS PARA O ESCRITÓRIO DE CONTABILIDADE
								</Text>

								<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
									PROTEÇÃO PATRIMONIAL DOS CLIENTES
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
									Incorpore ao seu leque de benefícios uma solução para proteção
									do patrimônio e da continuidade dos negócios de seus clientes,
									oferecendo uma parceria com a XCAR Corretora de Seguros, com
									condições comerciais diferenciadas e descontos exclusivos na
									contratação ou renovação de seguros, conforme as condições de
									cada produto.
								</Text>

								<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
									COMISSIONAMENTO VITALÍCIO
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
									Percentual sobre os ganhos da corretora decorrentes das
									indicações de clientes que resultem na efetiva contratação de
									seguros, conforme as condições estabelecidas na parceria.
								</Text>

								<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
									CUSTO DE IMPLANTAÇÃO
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
									Sem qualquer custo financeiro para o escritório e sem
									necessidade de estrutura ou carga operacional adicional
									relevante para a implantação da parceria.
								</Text>

								<Text className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
									ACESSO AO APLICATIVO PARA PARCEIROS
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
									Aplicativo dedicado ao escritório de contabilidade, permitindo
									acompanhar o número de adesões e consultar relatórios
									financeiros relacionados às indicações e aos resultados da
									parceria.
								</Text>
							</Section>

							<Section className="mb-6">
								<Text className="text-[12px] font-bold text-primary m-0 mb-1.5">
									CONSIDERAÇÕES FINAIS
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
									A parceria GESTÃO + PROTEÇÃO permite ao escritório de
									contabilidade ampliar o valor entregue aos seus clientes,
									oferecendo acesso a soluções de proteção patrimonial sem
									interferir na atividade principal do escritório.
								</Text>
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
									Coloco-me à disposição para esclarecer eventuais dúvidas e
									apresentar, de forma detalhada, o funcionamento do programa,
									suas condições e os benefícios que essa parceria poderá
									proporcionar ao seu escritório e aos seus clientes.
								</Text>
							</Section>

							<Text className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
								Atenciosamente,
							</Text>

							<Section className="pt-16 border-t border-solid border-[#D1D5DB]">
								<Text className="text-[11px] leading-[16px] text-[#374151] m-0">
									Fernando Luiz Malheiros de Sena
								</Text>
								<Text className="text-[11px] leading-[16px] text-muted m-0 mb-3">
									Diretor – XCAR Corretora de Seguros
								</Text>
								<Text className="text-[9px] tracking-wide text-muted uppercase m-0 mb-1.5">
									Seguradoras parceiras
								</Text>
								<InsurerLogoGrid />
							</Section>
						</Section>

						<Section className="px-10 py-4 border-t border-solid border-[#E5E7EB]">
							<Row>
								<Column>
									<Text className="text-[10px] text-muted m-0">
										XCAR CORRETORA DE SEGUROS
									</Text>
								</Column>
								<Column align="right">
									<Text className="text-[10px] text-muted m-0">
										segwise.com.br
									</Text>
								</Column>
							</Row>
						</Section>
					</Section>
				</Body>
			</Tailwind>
		</Html>
	);
}

export { TemplatePartnershipInviteAccounting };
