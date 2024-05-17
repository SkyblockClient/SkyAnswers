const DevUser = 'ethan';
const user = process.env.USER || process.env.USERNAME;
export const isDevUser = user == DevUser;
export const repoFilesURL = 'https://github.com/SkyblockClient/SkyblockClient-REPO/raw/main/files';

export enum Servers {
	SkyClient = '780181693100982273',
	Dev = '959660149344198706'
}

export enum Channels {
	Trolling = '887818760126345246',
	BotLogs = '934968221923168266',
	Tickets = '1222344626325688330',
	ModUpdating = '1198710827327434852'
}

export enum Roles {
	CoolPeople = '832754819588292679',
	NoGiveaways = '832325812329906176',
	GitHubKeeper = '799020944487612428',
	NitroBooster = '829336516315971626',
	NoAuto = '852016624605462589'
}

export enum Users {
	TicketTool = '557628352828014614',
	Fire = '444871677176709141',
	BotDev = '157917665162297344'
}

export enum Emojis {
	YouWhat = '<:youwhat:889306727953104936>',
	BlameWyvest = '<:blamewyvest:1001055682289741864>'
}
