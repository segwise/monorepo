import { z } from 'zod';
import type { Server } from '@/@types/server';
import { registerRoutersServicesEndorsementsAddress } from './address';
import { registerRoutersServicesEndorsementsCancel } from './cancel';
import { registerRoutersServicesEndorsementsExtractPDF } from './extract-pdf';
import { registerRoutersServicesEndorsementsFranchise } from './franchise';
import { registerRoutersServicesEndorsementsListining } from './listining';
import { registerRoutersServicesEndorsementsVehicleConductor } from './vehicle-conductor';

function registerRoutersServicesEndorsements(server: Server) {
	const base = server.basePath(`/endorsements`);

	registerRoutersServicesEndorsementsExtractPDF(base);

	const baseID = base.basePath(
		`/:id{${z.regexes.uuid7.source.slice(1).slice(0, -1)}}`,
	);

	registerRoutersServicesEndorsementsListining(baseID);
	registerRoutersServicesEndorsementsVehicleConductor(baseID);
	registerRoutersServicesEndorsementsAddress(baseID);
	registerRoutersServicesEndorsementsFranchise(baseID);
	registerRoutersServicesEndorsementsCancel(baseID);
}

export { registerRoutersServicesEndorsements };
