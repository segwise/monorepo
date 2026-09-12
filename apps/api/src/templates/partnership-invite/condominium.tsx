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

function InsurerLogoGrid() {
	return (
		<div className="grid grid-cols-8 gap-1">
			{partnerInsurers.map((insurer) => (
				<div
					key={insurer.name}
					className="border border-solid border-[#E5E7EB] rounded py-1 px-1 flex items-center justify-center"
				>
					<img
						src={insurer.logo}
						alt={insurer.name}
						width={40}
						height={15}
						className="object-contain"
					/>
				</div>
			))}
		</div>
	);
}

function TemplatePartnershipInviteCondominium({
	leadId,
}: {
	leadId?: string;
} = {}) {
	const urlMessage = new URL(
		'https://segwise.com.br/gestao-protecao-condominio',
	);
	if (leadId) urlMessage.searchParams.set('leadId', leadId);

	return (
		<html lang="pt-BR">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<title>Gestão + Proteção — Administradora de Condomínios | XCAR</title>
				<script src="https://cdn.tailwindcss.com"></script>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							tailwind.config = {
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
							};
						`,
					}}
				/>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
					rel="stylesheet"
				/>
				<style>{`
					body { font-family: 'Inter', Arial, sans-serif; }
					@media print {
						* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				`}</style>
			</head>
			<body className="bg-white m-0">
				<div className="mx-auto max-w-[680px]">
					<div className="flex items-center justify-between bg-primary px-10 py-4 break-inside-avoid">
						<img
							src={LOGO_WHITE}
							alt="XCAR CORRETORA DE SEGUROS"
							width={120}
							height={27}
						/>
						<span className="text-[10px] tracking-wide text-[#9CA3AF] uppercase">
							Proposta de parceria comercial
						</span>
					</div>
					<div className="px-10 pt-5 pb-5">
						<p className="text-[11px] text-[#374151] text-right m-0 mb-5">
							Recife, ____ de __________________ de 2026.
						</p>
						<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
							À(ao) Sr.(a) Responsável por Novos Negócios
						</p>
						<p className="text-[11px] text-[#374151] m-0 mb-0.5">
							(Administradora de Condomínios)
						</p>
						<p className="text-[11px] text-[#374151] m-0 mb-4">
							Prezado(a) Senhor(a),
						</p>

						<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
							Uma excelente oportunidade para ampliar os benefícios oferecidos
							aos clientes sob a gestão de sua empresa.
						</p>

						<p className="text-[12px] font-bold text-primary m-0 mb-1.5">
							PROTEÇÃO AO PATRIMÔNIO
						</p>
						<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-3">
							Sendo a missão de sua empresa cuidar da gestão e do patrimônio
							coletivo dos condomínios, apresentamos uma parceria com a XCAR
							Corretora de Seguros para também oferecer proteção aos bens
							particulares dos condôminos, agregando valor aos serviços já
							disponibilizados.
						</p>
						<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
							Meu nome é Fernando Luiz Malheiros de Sena, Diretor da XCAR
							Corretora de Seguros, e gostaria de apresentar, em parceria com
							sua empresa, o programa "GESTÃO + PROTEÇÃO", desenvolvido para
							gerar benefícios aos condôminos e novas oportunidades para a
							administradora.
						</p>

						<div className="mb-4 break-inside-avoid">
							<p className="text-[12px] font-bold text-primary m-0 mb-1.5">
								1. BENEFÍCIOS AOS CLIENTES
							</p>
							<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								Acesso ao aplicativo Segwise
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
								Um aplicativo relevante e de fácil utilização, que amplia os
								benefícios oferecidos pela administradora, funcionando como um
								verdadeiro assistente de bolso e centralizando serviços,
								informações e orientações essenciais, tais como:
							</p>

							<div className="flex items-start gap-2 mb-1">
								<span className="text-[11px] text-[#9CA3AF] leading-[16px]">
									•
								</span>
								<p className="text-[11px] leading-[16px] text-[#374151] m-0">
									<b>EVITAR NEGATIVA DE SINISTRO</b> – orientações sobre temas
									como principal condutor, CEP de pernoite, cobertura para
									condutores entre 18 e 25 anos, deveres do segurado, situações
									que podem ocasionar recusa de cobertura, entre outros.
								</p>
							</div>
							<div className="flex items-start gap-2 mb-1">
								<span className="text-[11px] text-[#9CA3AF] leading-[16px]">
									•
								</span>
								<p className="text-[11px] leading-[16px] text-[#374151] m-0">
									<b>CONSULTA VEICULAR</b> – informações sobre valor médio da
									FIPE, multas, gravames, infrações, débitos, IPVA,
									licenciamento, DPVAT, roubo e sinistros.
								</p>
							</div>
							<div className="flex items-start gap-2 mb-1">
								<span className="text-[11px] text-[#9CA3AF] leading-[16px]">
									•
								</span>
								<p className="text-[11px] leading-[16px] text-[#374151] m-0">
									<b>ASSISTÊNCIAS</b> – telefones e orientações para solicitar
									reboque, comunicar sinistro, solicitar substituição de vidros,
									faróis e lanternas, entre outros serviços.
								</p>
							</div>
							<div className="flex items-start gap-2">
								<span className="text-[11px] text-[#9CA3AF] leading-[16px]">
									•
								</span>
								<p className="text-[11px] leading-[16px] text-[#374151] m-0">
									<b>ORIENTAÇÃO EM CASO DE SINISTRO</b> – informações sobre como
									agir, para onde ligar, quais providências tomar e como
									proceder em situações que envolvam vítimas.
								</p>
							</div>
						</div>

						<div className="mb-4 break-inside-avoid">
							<p className="text-[12px] font-bold text-primary m-0 mb-1.5">
								2. BENEFÍCIOS PARA A ADMINISTRADORA DE CONDOMÍNIOS
							</p>

							<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								PROTEÇÃO PATRIMONIAL
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
								Amplie o seu leque de benefícios, oferecendo aos condôminos a
								possibilidade de proteger seus patrimônios particulares por meio
								de uma parceria com a XCAR Corretora de Seguros, com acesso a
								condições comerciais diferenciadas e descontos exclusivos na
								contratação ou renovação de seguros.
							</p>

							<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								COMISSIONAMENTO VITALÍCIO
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
								Percentual sobre os ganhos da corretora decorrentes das
								indicações de clientes que resultem na efetiva contratação de
								seguros, conforme as condições estabelecidas na parceria.
							</p>

							<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								CUSTO DE IMPLANTAÇÃO
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-2">
								Sem qualquer custo financeiro ou necessidade de estrutura
								operacional adicional por parte da administradora.
							</p>

							<p className="text-[11px] font-bold text-[#374151] m-0 mb-0.5">
								ACESSO AO APLICATIVO PARA PARCEIROS
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0">
								Aplicativo dedicado à administradora de condomínios, permitindo
								o acompanhamento das adesões realizadas e o acesso a relatórios
								financeiros referentes às indicações e aos resultados da
								parceria.
							</p>
						</div>

						<div className="mb-6 break-inside-avoid">
							<p className="text-[12px] font-bold text-primary m-0 mb-1.5">
								CONSIDERAÇÕES FINAIS
							</p>
							<p className="text-[11px] leading-[16px] text-[#374151] m-0">
								Coloco-me à disposição para esclarecer eventuais dúvidas e
								apresentar, de forma detalhada, o funcionamento do programa,
								suas condições e os benefícios que a parceria poderá
								proporcionar à sua empresa e aos seus clientes.
							</p>
						</div>

						<p className="text-[11px] leading-[16px] text-[#374151] m-0 mb-4">
							Atenciosamente,
						</p>

						<div className="pt-16 border-t border-solid border-[#D1D5DB] break-inside-avoid">
							<p className="text-[11px] leading-[16px] text-[#374151] m-0">
								Fernando Luiz Malheiros de Sena
							</p>
							<p className="text-[11px] leading-[16px] text-muted m-0 mb-3">
								Diretor – XCAR Corretora de Seguros
							</p>
							<p className="text-[9px] tracking-wide text-muted uppercase m-0 mb-1.5">
								Seguradoras parceiras
							</p>
							<InsurerLogoGrid />
						</div>
					</div>
					<div className="px-10 py-4 border-t border-solid border-[#E5E7EB] flex items-center justify-between">
						<span className="text-[10px] text-muted">
							XCAR CORRETORA DE SEGUROS
						</span>
						<span className="text-[10px] text-muted">segwise.com.br</span>
					</div>
				</div>
			</body>
		</html>
	);
}

export { TemplatePartnershipInviteCondominium };
