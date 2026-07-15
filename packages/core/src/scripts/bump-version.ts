import { readFileSync, writeFileSync } from 'node:fs';

const type = process.argv[2];

if (!type || !['major', 'minor', 'patch'].includes(type)) {
	process.exit(1);
}

const pkgPath = './package.json';
const pkgText = readFileSync(pkgPath, 'utf-8');
const pkg = JSON.parse(pkgText);
const [majorStr, minorStr, patchStr] = pkg.version.split('.');

let major = Number(majorStr);
let minor = Number(minorStr);
let patch = Number(patchStr);

if (type === 'major') {
	major++;
	minor = 0;
	patch = 0;
} else if (type === 'minor') {
	minor++;
	patch = 0;
} else if (type === 'patch') {
	patch++;
}

const newVersion = `${major}.${minor}.${patch}`;

pkg.version = newVersion;

writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
