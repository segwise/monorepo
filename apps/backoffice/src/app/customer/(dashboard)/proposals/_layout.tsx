import '@/styles/globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Propostas',
};

function ProposalsLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return children;
}

export default ProposalsLayout;
