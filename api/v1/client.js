//#region src/lib/codecs.ts
function e(e) {
	let t = new TextEncoder().encode(e), n = "";
	for (let e of t) n += String.fromCharCode(e);
	return btoa(n);
}
function t(e) {
	let t = e.replace(/\s/g, "");
	if (!t) throw Error("Nothing to decode.");
	if (!/^[A-Za-z0-9+/]*={0,2}$/.test(t)) throw Error("That is not valid Base64. Allowed characters are A-Z a-z 0-9 + / and = padding.");
	let n = t.padEnd(Math.ceil(t.length / 4) * 4, "="), r = atob(n), i = Uint8Array.from(r, (e) => e.charCodeAt(0));
	return new TextDecoder("utf-8", { fatal: !1 }).decode(i);
}
function n(t) {
	return e(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function r(e) {
	return i(e.replace(/-/g, "+").replace(/_/g, "/"));
}
function i(e) {
	let t = e.padEnd(Math.ceil(e.length / 4) * 4, "="), n = atob(t), r = Uint8Array.from(n, (e) => e.charCodeAt(0));
	return new TextDecoder("utf-8", { fatal: !1 }).decode(r);
}
function a(e) {
	return encodeURIComponent(e);
}
function o(e) {
	try {
		return decodeURIComponent(e.replace(/\+/g, " "));
	} catch {
		throw Error("That is not a valid percent-encoded string.");
	}
}
//#endregion
//#region src/lib/color.ts
var s = (e, t, n) => Math.min(n, Math.max(t, e)), c = (e) => Math.round(e * 100) / 100;
function l(e) {
	let t = e.replace(/^#/, "").trim();
	return /^[0-9a-f]{3}$/i.test(t) ? t.split("").map((e) => e + e).join("") : t;
}
function u(e) {
	return /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(e.trim());
}
function d(e) {
	let t = l(e);
	if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(t)) throw Error("Enter a hex color like #5865f2 or 5865f2.");
	return {
		r: parseInt(t.slice(0, 2), 16),
		g: parseInt(t.slice(2, 4), 16),
		b: parseInt(t.slice(4, 6), 16)
	};
}
function f({ r: e, g: t, b: n }) {
	return `#${[
		e,
		t,
		n
	].map((e) => s(Math.round(e), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}
function ee({ r: e, g: t, b: n }) {
	let r = e / 255, i = t / 255, a = n / 255, o = Math.max(r, i, a), s = Math.min(r, i, a), l = o - s, u = (o + s) / 2, d = 0, f = 0;
	return l !== 0 && (f = l / (1 - Math.abs(2 * u - 1)), d = o === r ? 60 * ((i - a) / l % 6) : o === i ? 60 * ((a - r) / l + 2) : 60 * ((r - i) / l + 4)), {
		h: c((d % 360 + 360) % 360),
		s: c(f * 100),
		l: c(u * 100)
	};
}
function te({ h: e, s: t, l: n }) {
	let r = t / 100, i = n / 100, a = (1 - Math.abs(2 * i - 1)) * r, o = (e % 360 + 360) % 360 / 60, s = a * (1 - Math.abs(o % 2 - 1)), c = i - a / 2, [l, u, d] = [
		[
			a,
			s,
			0
		],
		[
			s,
			a,
			0
		],
		[
			0,
			a,
			s
		],
		[
			0,
			s,
			a
		],
		[
			s,
			0,
			a
		],
		[
			a,
			0,
			s
		]
	][Math.floor(o) % 6];
	return {
		r: Math.round((l + c) * 255),
		g: Math.round((u + c) * 255),
		b: Math.round((d + c) * 255)
	};
}
function ne(e) {
	let t = e.match(/(-?\d+(?:\.\d+)?)/g);
	if (!t || t.length < 3) throw Error("Enter RGB values like 88, 101, 242.");
	let [n, r, i] = t.slice(0, 3).map(Number);
	if ([
		n,
		r,
		i
	].some((e) => Number.isNaN(e))) throw Error("Enter RGB values like 88, 101, 242.");
	return {
		r: n,
		g: r,
		b: i
	};
}
function re(e) {
	let t = e.match(/(-?\d+(?:\.\d+)?)/g);
	if (!t || t.length < 3) throw Error("Enter HSL values like 235, 89, 65.");
	let [n, r, i] = t.slice(0, 3).map(Number);
	if ([
		n,
		r,
		i
	].some((e) => Number.isNaN(e))) throw Error("Enter HSL values like 235, 89, 65.");
	return {
		h: n,
		s: r,
		l: i
	};
}
function ie(e, t) {
	if (!u(e)) return "#888888";
	let { r: n, g: r, b: i } = d(e), a = (e) => Math.max(0, Math.min(255, Math.round(t > 0 ? e + (255 - e) * t : e * (1 + t))));
	return `#${[
		a(n),
		a(r),
		a(i)
	].map((e) => e.toString(16).padStart(2, "0")).join("")}`;
}
function p({ r: e, g: t, b: n }) {
	let r = (e) => {
		let t = e / 255;
		return t <= .03928 ? t / 12.92 : ((t + .055) / 1.055) ** 2.4;
	};
	return .2126 * r(e) + .7152 * r(t) + .0722 * r(n);
}
function ae(e, t) {
	let n = p(e), r = p(t), i = Math.max(n, r), a = Math.min(n, r);
	return (i + .05) / (a + .05);
}
function oe(e) {
	let t = d(e), n = {
		r: 255,
		g: 255,
		b: 255
	}, r = {
		r: 0,
		g: 0,
		b: 0
	}, i = ae(t, n), a = ae(t, r), o = i >= a;
	return {
		ratio: c(Math.max(i, a)),
		aaNormal: Math.max(i, a) >= 4.5,
		aaLarge: Math.max(i, a) >= 3,
		aaaNormal: Math.max(i, a) >= 7,
		bestText: o ? "White text" : "Black text",
		bestTextHex: o ? "#ffffff" : "#000000"
	};
}
function se(e) {
	try {
		let t = p(d(e));
		return t > .45 ? "Light" : t > .08 ? "Mid" : "Dark";
	} catch {
		return "Mid";
	}
}
var ce = [
	"#5865f2",
	"#3ba55c",
	"#faa61a",
	"#ed4245",
	"#eb459e",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#f1c40f",
	"#e74c3c",
	"#3498db",
	"#2ecc71",
	"#9c27b0",
	"#ff6b6b",
	"#4ecdc4",
	"#f9ca24",
	"#e17055",
	"#00b894",
	"#6c5ce7",
	"#fd79a8"
], le = [
	{
		id: "early_supporter",
		name: "Early Supporter",
		group: "Early Access",
		description: "Was on Discord during the first year of Nitro early access.",
		howToGet: "Not obtainable anymore."
	},
	{
		id: "early_verified_bot_dev",
		name: "Early Verified Bot Developer",
		group: "Early Access",
		description: "Verified bot developer during the first year of early access.",
		howToGet: "Not obtainable anymore."
	},
	{
		id: "verified_bot_dev",
		name: "Verified Bot Developer",
		group: "Developer",
		description: "Owner of a bot verified under Discord's developer programme.",
		howToGet: "Apply for verification with a bot that passes the review criteria."
	},
	{
		id: "certified_moderator",
		name: "Certified Moderator",
		group: "Moderation",
		description: "Active in Discord Moderator, the official community support programme.",
		howToGet: "Join the Discord Moderator programme and complete the training."
	},
	{
		id: "bug_hunter_1",
		name: "Bug Hunter Level 1",
		group: "Bug Hunter",
		description: "Reward for reporting bugs or helping on Discord's bug bounty.",
		howToGet: "Report a bug that gets accepted on the bug bounty."
	},
	{
		id: "bug_hunter_2",
		name: "Bug Hunter Level 2",
		group: "Bug Hunter",
		description: "Higher tier of the bug bounty reward.",
		howToGet: "Submit a high-quality bug report."
	},
	{
		id: "hypesquad_events",
		name: "HypeSquad Events",
		group: "HypeSquad",
		description: "Attended a HypeSquad event in person or online.",
		howToGet: "Join a HypeSquad event."
	},
	{
		id: "hypesquad_bravery",
		name: "HypeSquad Bravery",
		group: "HypeSquad",
		description: "Member of the HypeSquad Bravery house.",
		howToGet: "Apply to join a HypeSquad house."
	},
	{
		id: "hypesquad_brilliance",
		name: "HypeSquad Brilliance",
		group: "HypeSquad",
		description: "Member of the HypeSquad Brilliance house.",
		howToGet: "Apply to join a HypeSquad house."
	},
	{
		id: "hypesquad_balance",
		name: "HypeSquad Balance",
		group: "HypeSquad",
		description: "Member of the HypeSquad Balance house.",
		howToGet: "Apply to join a HypeSquad house."
	},
	{
		id: "premium_early_supporter",
		name: "Premium Early Supporter",
		group: "Early Access",
		description: "Has had Discord Nitro since the first year it existed.",
		howToGet: "Not obtainable anymore."
	},
	{
		id: "active_developer",
		name: "Active Developer",
		group: "Developer",
		description: "Developer of an active application over the last month.",
		howToGet: "Have an app with a published command over the past month."
	},
	{
		id: "http_interactions_bot",
		name: "Bot HTTP Interactions",
		group: "Developer",
		description: "Early reward for bots using HTTP interactions instead of a gateway connection.",
		howToGet: "Not obtainable anymore."
	}
], ue = [
	"All",
	"Early Access",
	"Community",
	"Bug Hunter",
	"HypeSquad",
	"Partner",
	"Developer",
	"Moderation"
], m = [
	{
		name: "Create Invite",
		bit: 1n << 0n,
		category: "General",
		description: "Invite people to the server."
	},
	{
		name: "Kick Members",
		bit: 1n << 1n,
		category: "General",
		description: "Remove members from the server."
	},
	{
		name: "Ban Members",
		bit: 1n << 2n,
		category: "General",
		description: "Permanently ban members."
	},
	{
		name: "Administrator",
		bit: 1n << 3n,
		category: "Advanced",
		description: "Grants every permission and bypasses channel overwrites.",
		note: "This one permission overrides all others."
	},
	{
		name: "Manage Channels",
		bit: 1n << 4n,
		category: "General",
		description: "Create, edit, and delete channels."
	},
	{
		name: "Manage Server",
		bit: 1n << 5n,
		category: "General",
		description: "Change server name, region, icon, and owner."
	},
	{
		name: "Add Reactions",
		bit: 1n << 6n,
		category: "Text",
		description: "Add new reactions to messages."
	},
	{
		name: "View Audit Log",
		bit: 1n << 7n,
		category: "Advanced",
		description: "See a record of who did what."
	},
	{
		name: "Priority Speaker",
		bit: 1n << 8n,
		category: "Voice",
		description: "Lower everyone else's volume."
	},
	{
		name: "Video",
		bit: 1n << 9n,
		category: "Voice",
		description: "Share video, screen, and stream."
	},
	{
		name: "View Channels",
		bit: 1n << 10n,
		category: "Membership",
		description: "See channels by default."
	},
	{
		name: "Send Messages",
		bit: 1n << 11n,
		category: "Text",
		description: "Post messages in text channels."
	},
	{
		name: "Send TTS Messages",
		bit: 1n << 12n,
		category: "Text",
		description: "Send text-to-speech messages."
	},
	{
		name: "Manage Messages",
		bit: 1n << 13n,
		category: "Text",
		description: "Delete and pin any message."
	},
	{
		name: "Embed Links",
		bit: 1n << 14n,
		category: "Text",
		description: "Links you post show a preview card."
	},
	{
		name: "Attach Files",
		bit: 1n << 15n,
		category: "Text",
		description: "Upload images and files."
	},
	{
		name: "Read Message History",
		bit: 1n << 16n,
		category: "Text",
		description: "See messages sent before you joined."
	},
	{
		name: "Mention @everyone",
		bit: 1n << 17n,
		category: "Text",
		description: "Ping the whole server.",
		note: "Also needs permission on the specific channel."
	},
	{
		name: "Use External Emoji",
		bit: 1n << 18n,
		category: "Text",
		description: "Use emoji from other servers."
	},
	{
		name: "View Server Insights",
		bit: 1n << 19n,
		category: "Advanced",
		description: "See growth and engagement stats."
	},
	{
		name: "Connect",
		bit: 1n << 20n,
		category: "Voice",
		description: "Join voice channels."
	},
	{
		name: "Speak",
		bit: 1n << 21n,
		category: "Voice",
		description: "Talk in voice channels."
	},
	{
		name: "Mute Members",
		bit: 1n << 22n,
		category: "Voice",
		description: "Server-mute other members."
	},
	{
		name: "Deafen Members",
		bit: 1n << 23n,
		category: "Voice",
		description: "Server-deafen other members."
	},
	{
		name: "Move Members",
		bit: 1n << 24n,
		category: "Voice",
		description: "Move members between voice channels."
	},
	{
		name: "Use Voice Activity",
		bit: 1n << 25n,
		category: "Voice",
		description: "Show speaking indicator without speaking."
	},
	{
		name: "Change Nickname",
		bit: 1n << 26n,
		category: "Membership",
		description: "Change your own nickname."
	},
	{
		name: "Manage Nicknames",
		bit: 1n << 27n,
		category: "Membership",
		description: "Change anyone else's nickname."
	},
	{
		name: "Manage Roles",
		bit: 1n << 28n,
		category: "General",
		description: "Create and assign roles below their highest role."
	},
	{
		name: "Manage Webhooks",
		bit: 1n << 29n,
		category: "Apps",
		description: "Create and manage webhooks."
	},
	{
		name: "Manage Emojis and Stickers",
		bit: 1n << 30n,
		category: "Apps",
		description: "Add and remove emojis and stickers."
	},
	{
		name: "Use Application Commands",
		bit: 1n << 31n,
		category: "Apps",
		description: "Run slash commands."
	},
	{
		name: "Request to Speak",
		bit: 1n << 32n,
		category: "Voice",
		description: "Request permission to talk in a stage."
	},
	{
		name: "Manage Events",
		bit: 1n << 33n,
		category: "General",
		description: "Create and manage scheduled events."
	},
	{
		name: "Manage Threads",
		bit: 1n << 34n,
		category: "Text",
		description: "Create, rename, and delete threads."
	},
	{
		name: "Create Public Threads",
		bit: 1n << 35n,
		category: "Text",
		description: "Create threads anyone can view."
	},
	{
		name: "Create Private Threads",
		bit: 1n << 36n,
		category: "Text",
		description: "Create invite-only threads."
	},
	{
		name: "Use External Stickers",
		bit: 1n << 37n,
		category: "Apps",
		description: "Send stickers from other servers."
	},
	{
		name: "Send Messages in Threads",
		bit: 1n << 38n,
		category: "Text",
		description: "Post inside threads."
	},
	{
		name: "Use Emoji Picker",
		bit: 1n << 39n,
		category: "Apps",
		description: "Use the built-in emoji picker."
	},
	{
		name: "Moderate Members",
		bit: 1n << 40n,
		category: "Advanced",
		description: "Timeout members and dismiss warnings."
	}
], de = [
	"General",
	"Membership",
	"Text",
	"Voice",
	"Apps",
	"Advanced"
];
function fe(e) {
	return "0x" + e.toString(16).toUpperCase();
}
function pe(e) {
	return e.toString(10);
}
function me(e) {
	return e.toString(2).padStart(41, "0");
}
function he(e) {
	let t = Math.floor(e.getTime() / 1e3), n = e.toISOString().replace(".000Z", "Z"), r = `<t:${t}:t>`, i = `<t:${t}:T>`, a = `<t:${t}:d>`, o = `<t:${t}:D>`, s = `<t:${t}:F>`, c = `<t:${t}:R>`;
	return {
		shortTime: r,
		longTime: i,
		shortDate: a,
		longDate: o,
		relative: c,
		unix: String(t),
		iso: n,
		tags: [
			r,
			i,
			a,
			o,
			s,
			c
		].join("\n")
	};
}
function ge(e, t = /* @__PURE__ */ new Date()) {
	let n = Math.round((e.getTime() - t.getTime()) / 1e3), r = Math.abs(n), i = [
		[31536e3, "year"],
		[2592e3, "month"],
		[604800, "week"],
		[86400, "day"],
		[3600, "hour"],
		[60, "minute"],
		[1, "second"]
	], a = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	for (let [e, t] of i) if (r >= e) return a.format(Math.round(n / e), t);
	return "just now";
}
var _e = [
	{
		syntax: "**bold**",
		result: "bold",
		note: "Bold text."
	},
	{
		syntax: "*italic*",
		result: "italic",
		note: "Italic text."
	},
	{
		syntax: "_italic_",
		result: "italic",
		note: "Underscores work too, but not inside words."
	},
	{
		syntax: "~~strikethrough~~",
		result: "strikethrough",
		note: "Needs two tildes on each side."
	},
	{
		syntax: "__underline__",
		result: "underline",
		note: "Discord specific, not standard Markdown."
	},
	{
		syntax: "||spoiler||",
		result: "spoiler",
		note: "Click or tap to reveal. Spoilers can span lines.",
		preview: !0
	},
	{
		syntax: "> quote",
		result: "quote",
		note: "Put it at the start of the line."
	},
	{
		syntax: "# heading 1",
		result: "heading 1",
		note: "Type # then a space, up to # for smaller."
	},
	{
		syntax: "###### heading 6",
		result: "heading 6",
		note: "Six levels, then it stops being a heading."
	},
	{
		syntax: "-# heading",
		result: "sub-heading",
		note: "H1 to H3 only. Shown in the member list."
	},
	{
		syntax: "```code block```",
		result: "code block",
		note: "Set a language for highlighting.",
		preview: !0
	},
	{
		syntax: "```-no language",
		result: "no syntax highlight",
		note: "Wrap a language in minus signs to disable highlighting.",
		preview: !0
	},
	{
		syntax: "```diff\n- removed\n+ added\n```",
		result: "diff block",
		note: "Minus lines are red, plus lines are green.",
		preview: !0
	},
	{
		syntax: "inline `code`",
		result: "inline code",
		note: "One backtick each side, no line breaks inside."
	},
	{
		syntax: "[text](https://url)",
		result: "link",
		note: "Link text can be anything."
	},
	{
		syntax: "[](https://url)",
		result: "embed-less link",
		note: "Empty text, hides the link preview."
	},
	{
		syntax: "> # heading\n> ## next line",
		result: "heading, not quote",
		note: "Anything after the first blank quote line is a normal heading.",
		preview: !0
	},
	{
		syntax: "\\*escape\\*",
		result: "*escape*",
		note: "Backslash stops formatting."
	},
	{
		syntax: "# heading\n-# sub",
		result: "escaped heading",
		note: "Zero-width space after # hides a heading.",
		preview: !0
	},
	{
		syntax: "-# not a heading",
		result: "literal heading",
		note: "Dash before the hash stops the heading."
	},
	{
		syntax: "<t:1700000000:R>",
		result: "relative timestamp",
		note: "R for relative, F for full, t for time only."
	},
	{
		syntax: "<t:1700000000:F>",
		result: "absolute timestamp",
		note: "Follows each user's timezone."
	},
	{
		syntax: "<@123456789>",
		result: "user mention",
		note: "Notifies the user."
	},
	{
		syntax: "<@!123456789>",
		result: "nickname mention",
		note: "Shows their current nickname."
	},
	{
		syntax: "<@&123456789>",
		result: "role mention",
		note: "Pings everyone with that role."
	},
	{
		syntax: "#channel",
		result: "channel link",
		note: "Pastes a clickable channel reference."
	},
	{
		syntax: "```\n# not a heading\n```",
		result: "safe heading",
		note: "Inside a code block nothing is formatted.",
		preview: !0
	}
], h = [
	{
		id: "user",
		label: "User",
		template: "<@USER_ID>",
		note: "Pings the user and shows their avatar."
	},
	{
		id: "nickname",
		label: "Nickname",
		template: "<@!USER_ID>",
		note: "Shows their nickname instead of username."
	},
	{
		id: "role",
		label: "Role",
		template: "<@&ROLE_ID>",
		note: "Pings everyone with that role."
	},
	{
		id: "channel",
		label: "Channel",
		template: "<#CHANNEL_ID>",
		note: "Renders as a clickable channel name."
	},
	{
		id: "everyone",
		label: "Everyone",
		template: "@everyone",
		note: "Needs permission to ping it."
	},
	{
		id: "here",
		label: "Here",
		template: "@here",
		note: "Pings only members who are online."
	},
	{
		id: "stage",
		label: "Stage host",
		template: "<@&STAGE_ROLE_ID>",
		note: "Mentioning the stage host role."
	},
	{
		id: "command",
		label: "Slash command",
		template: "</COMMAND_ID:COMMAND_ID>",
		note: "Built-in command, e.g. </shuffle:0>."
	},
	{
		id: "thread",
		label: "Thread starter",
		template: "<#THREAD_ID>",
		note: "Same syntax as a channel."
	},
	{
		id: "slash",
		label: "Slash command chat",
		template: "/COMMAND",
		note: "Commands you have installed."
	}
];
//#endregion
//#region src/lib/generators.ts
function g(e = Math.random) {
	return (t) => t[Math.floor(e() * t.length)];
}
var ve = g();
function ye(e, t = Math.random) {
	let n = [...e];
	for (let e = n.length - 1; e > 0; e--) {
		let r = Math.floor(t() * (e + 1));
		[n[e], n[r]] = [n[r], n[e]];
	}
	return n;
}
var be = /* @__PURE__ */ "silent.crimson.velvet.hollow.neon.quiet.iron.lunar.frozen.wild.hidden.electric.broken.golden.restless.pale.burnt.sacred.distant.endless.gentle.bitter.shattered.marble.sober.amber.stormy.humble.fatal.polar.static.eager.hollowed.wander.salt.onyx".split("."), xe = /* @__PURE__ */ "raven.cipher.lantern.harbor.ember.monolith.drift.signal.prism.atlas.echo.cinder.meridian.quartz.vulture.anthem.basalt.comet.dagger.ember.fathom.glacier.harrow.ivory.juniper.kestrel.lantern.monsoon.nimbus.onyx.pylon.ridge.summit.tundra.vector.willow.zephyr.cobalt.delta.ember".split("."), Se = /* @__PURE__ */ "xo.zz.0x._dev.png.mp4.irl.irl.smp.tv.404.911.101.13.2000.2077.07.99.01.2k.vx.ex.ox.uu.ii.ae.0o.1x".split("."), Ce = [
	"",
	"",
	"",
	".",
	"˙",
	"-",
	"_",
	"~",
	"°",
	"˚"
], we = {
	a: "4",
	e: "3",
	i: "1",
	o: "0",
	s: "5",
	t: "7",
	b: "8",
	g: "9",
	l: "1",
	z: "2"
};
function Te(e, t = Math.random) {
	let n = g(t), r = n(be), i = n(xe);
	switch (e) {
		case "aesthetic": {
			let e = n(Ce), a = n([
				".",
				"_",
				"-",
				""
			]), o = t() > .5, s = `${r}${a}${i}`;
			return `${e}${o ? s[0].toUpperCase() + s.slice(1) : s}${e}`;
		}
		case "minimal": return t() > .5 ? i : `${r}${i}`;
		case "gamer": return `${i}${n(Se)}`;
		case "leetspeak": {
			let e = (e) => Array.from(e).map((e) => t() > .35 ? we[e] ?? e : e).join("");
			return `${e(r)}${e(i)}`;
		}
		case "twoWord": return `${r}-${i}-${Math.floor(t() * 900 + 100)}`;
		case "symbolic": return `${r}${n([
			"",
			"",
			"",
			"⩊",
			"⁺",
			"˚",
			"ᶦ",
			"☾"
		])}${i}`;
	}
}
function Ee(e, t, n = Math.random) {
	let r = /* @__PURE__ */ new Set(), i = [], a = 0;
	for (; i.length < t && a < t * 40;) {
		a++;
		let t = Te(e, n);
		t.length > 32 || r.has(t.toLowerCase()) || (r.add(t.toLowerCase()), i.push(t));
	}
	return i;
}
var _ = /* @__PURE__ */ "Midnight.Crimson.Silent.Iron.Lunar.Static.Golden.Hollow.Frozen.Neon.Broken.Velvet.Amber.Storm.Shadow.Crystal.Ember.Quiet.Hidden.Wild.Northern.Ancient.Modern.Royal.Deep.Bright.Cosmic.Royal".split("."), v = /* @__PURE__ */ "Haven.Vault.Guild.Circle.Union.Collective.Society.Commons.Sanctuary.Outpost.Hangar.Archive.Garden.Depot.District.Guildhall.Workshop.Observatory.Library.Grounds.Base.Station.Club.Union.Sector.Concord.Bastion".split("."), De = [
	[
		"general",
		"staff",
		"support",
		"bot-cmds",
		"media",
		"voice",
		"staff-chat"
	],
	[
		"info",
		"rules",
		"faq",
		"roles",
		"welcome",
		"announcements",
		"staff-chat",
		"showcase"
	],
	[
		"general",
		"random",
		"memes",
		"games",
		"music",
		"movies",
		"suggestions",
		"clips"
	],
	[
		"coding",
		"dev",
		"help",
		"project",
		"snippet",
		"review",
		"deploys",
		"off-topic"
	]
], Oe = [
	"Head",
	"Deputy",
	"Lead",
	"Senior",
	"Junior",
	"Trial",
	"Head",
	"Veteran",
	"Elite",
	"Chief",
	"Grand",
	"Prime",
	"Apex",
	"Supreme"
], y = [
	"Admin",
	"Moderator",
	"Owner",
	"Helper",
	"Guardian",
	"Sentinel",
	"Curator",
	"Architect",
	"Strategist",
	"Warden",
	"Keeper",
	"Overseer",
	"Director",
	"Handler",
	"Enforcer",
	"Advisor",
	"Steward",
	"Marshal"
], ke = [
	"#5865f2",
	"#3ba55c",
	"#faa61a",
	"#ed4245",
	"#eb459e",
	"#9b59b6",
	"#1abc9c",
	"#e67e22",
	"#f1c40f",
	"#e74c3c",
	"#3498db",
	"#2ecc71"
];
function Ae(e = Math.random) {
	let t = g(e), n = Math.floor(e() * 4);
	return n === 0 ? `${t(_)} ${t(v)}` : n === 1 ? `The ${t(_)} ${t(v)}` : n === 2 ? `${t(_)}${t(v)}` : `${t(_)} ${t(v)}s`;
}
function je(e = Math.random) {
	let t = g(e)(De), n = Math.floor(e() * 4) + 2;
	return ye(t, e).slice(0, Math.min(n, t.length)).join("-");
}
function Me(e = Math.random) {
	let t = g(e), n = Math.floor(e() * 3);
	return n === 0 ? `${t(Oe)} ${t(y)}` : n === 1 ? t(y) : `${t(Oe)}${t(y)}`;
}
function Ne() {
	return {
		name: Me(),
		color: ve(ke),
		hoist: Math.random() > .5,
		mentionable: Math.random() > .4
	};
}
function Pe(e) {
	let t = [], n = /* @__PURE__ */ new Set(), r = 0;
	for (; t.length < e && r < e * 30;) {
		r++;
		let e = je();
		n.has(e) || (n.add(e), t.push(e));
	}
	return t;
}
var Fe = [
	"{adj} {noun} | {stack}",
	"{noun} enthusiast. {tagline}",
	"just here for the {noun}. {tagline}",
	"{stack} · {timezone} · {status}",
	"{adj} {noun} in the {place} | {stack}"
], Ie = [
	"sleep-deprived",
	"overthinking",
	"caffeinated",
	"midnight",
	"quietly",
	"chronically",
	"annoyingly",
	"recovering",
	"professional",
	"part-time"
], Le = [
	"overthinker",
	"daydreamer",
	"night owl",
	"home cook",
	"trail runner",
	"film hoarder",
	"coffee snob",
	"plant parent",
	"cyclist",
	"baker",
	"photographer",
	"mechanic",
	"listener",
	"collector",
	"tinkerer"
], Re = [
	"TS · Rust · Postgres",
	"Python · Docker · GCP",
	"design · Figma · motion",
	"Linux · Neovim · tmux",
	"Unity · C# · Blender",
	"Excel · VBA · Pain",
	"JS · React · Node",
	"writing · editing · caffeine"
], ze = [
	"ask me anything",
	"probably sleeping",
	"will fix it later",
	"down for anything",
	"not a morning person",
	"always listening",
	"currently learning Rust",
	"no spoilers please",
	"here for the music",
	"building things"
], Be = [
	"do not disturb",
	"open to collabs",
	"busy but responsive",
	"brb, rebooting",
	"reading, probably",
	"in the zone",
	"coffee #3"
], Ve = [
	"UTC+0",
	"UTC+1",
	"UTC-5",
	"UTC-8",
	"UTC+5:30",
	"UTC+9",
	"UTC-3",
	"somewhere in Europe",
	"the wrong side of the planet"
], He = [
	"Lisbon",
	"Osaka",
	"Reykjavik",
	"Toronto",
	"Nairobi",
	"Perth",
	"Bogota"
];
function Ue(e = Math.random) {
	let t = g(e);
	return t(Fe).replace("{adj}", () => t(Ie)).replace("{noun}", () => t(Le)).replace("{stack}", () => t(Re)).replace("{tagline}", () => t(ze)).replace("{timezone}", () => t(Ve)).replace("{status}", () => t(Be)).replace("{place}", () => t(He)).replace(/\s*\|\s*$/, "").replace(/\s{2,}/g, " ").trim();
}
var b = [
	"lil",
	"big",
	"silly",
	"neo",
	"ultra",
	"mega",
	"lmao",
	"ok",
	"not",
	"very",
	"so",
	"the"
], We = [
	"cat",
	"fox",
	"wolf",
	"bunny",
	"bird",
	"shark",
	"rat",
	"frog",
	"bee",
	"panda",
	"otter",
	"crab",
	"goat",
	"moose",
	"newt",
	"moth",
	"crow"
];
function Ge(e = Math.random) {
	let t = g(e), n = t(We), r = Math.floor(e() * 5);
	return r === 0 ? `${t(b)} ${n}` : r === 1 ? `${t(b)}${n}` : r === 2 ? `${n}${Math.floor(e() * 900 + 100)}` : r === 3 ? `${n}_${n}` : `${t(b)} ${n}${Math.floor(e() * 90 + 10)}`;
}
function Ke(e) {
	let t = /* @__PURE__ */ new Set(), n = [], r = 0;
	for (; n.length < e && r < e * 40;) {
		r++;
		let e = Ge();
		t.has(e.toLowerCase()) || (t.add(e.toLowerCase()), n.push(e));
	}
	return n;
}
var qe = [
	"online",
	"idle",
	"do not disturb",
	"invisible",
	"focus mode",
	"brb, coffee",
	"coding",
	"listening to music",
	"watching something",
	"reading",
	"gaming",
	"in a meeting",
	"on a walk",
	"eating",
	"commuting",
	"sleeping",
	"at the gym",
	"in the zone",
	"deep work",
	"afk",
	"just vibing",
	"thinking",
	"recharging"
], Je = [
	"💻",
	"🎨",
	"🎸",
	"☕",
	"😴",
	"🧘",
	"🥷",
	"🌱",
	"🍀",
	"🌛",
	"🦄",
	"🐈",
	"🐙",
	"🐛",
	"⚡",
	"🔥",
	"✨",
	"🚶",
	"🏃",
	"🧳",
	"💻",
	"✏",
	"📚",
	"🖥"
], x = [
	{
		id: "respect",
		name: "Be respectful",
		body: "Treat everyone here with respect. Harassment, hate speech, slurs, and personal attacks have no place here, and neither do bullying or unwanted DMs."
	},
	{
		id: "nospam",
		name: "No spam or advertising",
		body: "Do not post ads, server invites, self-promotion, or repetitive messages. Unsolicited mentions and mass DMs are not allowed."
	},
	{
		id: "nsfw",
		name: "Keep NSFW in marked channels",
		body: "Explicit or violent content is only allowed in channels clearly marked for it. Anything posted outside those channels gets removed."
	},
	{
		id: "nudity",
		name: "No nudity or sexual content",
		body: "Nudity, sexual content, and suggestive material are not allowed anywhere in this server."
	},
	{
		id: "gore",
		name: "No graphic violence",
		body: "Graphic images, gore, and self-harm content are not allowed. If you need to discuss something heavy, use the appropriate support channel."
	},
	{
		id: "staff",
		name: "Follow the staff",
		body: "Decisions made by staff are final. Do not argue with or harass moderators. Open a ticket if you think something was handled unfairly."
	},
	{
		id: "channel",
		name: "Use the right channel",
		body: "Post in the channel that fits the topic. If a channel is locked or read-only, do not try to work around it. Ask a staff member if you are stuck."
	},
	{
		id: "pics",
		name: "Credit your sources",
		body: "Repost anything you did not make and credit the original creator. Do not claim work that is not yours."
	},
	{
		id: "noimpersonation",
		name: "No impersonation",
		body: "Do not impersonate other users, staff, bots, or other servers. This includes fake names, avatars, and profile descriptions."
	},
	{
		id: "bot",
		name: "No abusing bots",
		body: "Do not use bots to spam, raid, or automate messages. If you want to add a bot, ask a staff member first."
	},
	{
		id: "hate",
		name: "Zero tolerance for hate",
		body: "Racist, sexist, homophobic, transphobic, ableist, or otherwise hateful behaviour results in an immediate ban. There is no warning for this one."
	},
	{
		id: "sensitive",
		name: "No personal information",
		body: "Do not share private information, addresses, phone numbers, passwords, or personal photos of anyone without their explicit permission."
	},
	{
		id: "language",
		name: "Keep it English",
		body: "Use English in the main channels so everyone can take part. Other language channels are fine."
	},
	{
		id: "political",
		name: "No politics or religion debates",
		body: "Political, religious, and ideological debates are not allowed in this server. Keep that off the platform."
	},
	{
		id: "links",
		name: "Link safety",
		body: "Do not post suspicious links, free Nitro codes, or anything that asks for your login. Staff will never DM you asking for your password or token."
	}
];
function Ye(e, t) {
	let n = [{
		friendly: `# Welcome to ${t.serverName}\n\nA few things to keep in mind so everyone has a good time:`,
		strict: `# ${t.serverName} — Rules\n\nThese are not optional. Read them before posting.`,
		minimal: `# ${t.serverName} rules`
	}[t.tone], ""];
	return e.forEach((e, r) => {
		let i = t.numbering === "numbers" ? `${r + 1}. **${e.name}**` : `${[
			"-",
			"*",
			"•",
			"▪"
		][r % 4]} **${e.name}**`;
		n.push(i), n.push(e.body), n.push("");
	}), t.tone !== "minimal" && n.push("---", "", t.tone === "friendly" ? "Thanks for reading. If anything here is unclear, just ask a staff member." : "Breaking these rules may get you muted, removed, or banned. No appeals on repeat offences."), n;
}
function Xe(e) {
	let t = e.memberCount.toLocaleString("en-US"), n = e.channelName ? `#${e.channelName}` : "this channel";
	return e.style === "plain" ? [
		`Welcome to ${e.serverName}, ${e.userName}!`,
		"",
		`You are member #${t}.`,
		"Say hello in " + n + " and take a look at the rules when you get a chance."
	].join("\n") : e.style === "image" ? JSON.stringify({
		content: `Welcome to ${e.serverName}, ${e.userName}!`,
		embeds: [{
			title: `Welcome to ${e.serverName}`,
			description: `Hey ${e.userName}, glad you made it.\nYou are member **#${t}**.`,
			color: parseInt(e.accent.replace("#", ""), 16),
			fields: [{
				name: "Members",
				value: t,
				inline: !0
			}, {
				name: "Next step",
				value: `Head to ${n} and say hello.`,
				inline: !0
			}],
			footer: { text: e.serverName },
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}]
	}, null, 2) : [
		`Welcome to **${e.serverName}**, ${e.userName} \u{1f44b}`,
		"",
		`You are member **#${t}**.`,
		"",
		`Say hello in ${n}.`,
		e.rulesUrl ? `Read the rules: ${e.rulesUrl}` : "Read the rules in the rules channel."
	].join("\n");
}
var Ze = "abcdefghijkmnopqrstuvwxyz", Qe = "ABCDEFGHJKLMNPQRSTUVWXYZ", $e = "23456789", et = "!@#$%^&*()-_=+[]{};:,.?/", tt = "l1IO0";
function nt(e) {
	if (typeof crypto < "u" && crypto.getRandomValues) {
		let t = /* @__PURE__ */ new Uint32Array(1);
		return crypto.getRandomValues(t), t[0] % e;
	}
	return Math.floor(Math.random() * e);
}
function rt(e, t) {
	let n = t ? e.replace(RegExp(`[${tt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`, "g"), "") : e;
	return n[nt(n.length)];
}
var S = {
	length: 20,
	lowercase: !0,
	uppercase: !0,
	digits: !0,
	symbols: !0,
	avoidAmbiguous: !0
};
function it(e) {
	let t = [];
	if (e.lowercase && t.push(Ze), e.uppercase && t.push(Qe), e.digits && t.push($e), e.symbols && t.push(et), t.length === 0) throw Error("Turn on at least one character type.");
	let n = t.join(""), r = t.map((t) => rt(t, e.avoidAmbiguous));
	for (; r.length < e.length;) r.push(rt(n, e.avoidAmbiguous));
	for (let e = r.length - 1; e > 0; e--) {
		let t = nt(e + 1);
		[r[e], r[t]] = [r[t], r[e]];
	}
	return r.join("");
}
function at(e) {
	let t = 0;
	/[a-z]/.test(e) && (t += 26), /[A-Z]/.test(e) && (t += 26), /[0-9]/.test(e) && (t += 10), /[^\w]/.test(e) && (t += 33);
	let n = t > 0 ? Math.log2(t) * e.length : 0, r = 0;
	return n >= 28 && (r = 1), n >= 36 && (r = 2), n >= 60 && (r = 3), n >= 80 && (r = 4), n >= 128 && (r = 5), {
		score: r,
		label: [
			"Very weak",
			"Weak",
			"Fair",
			"Strong",
			"Very strong",
			"Excellent"
		][r],
		bits: Math.round(n),
		poolSize: t
	};
}
function ot() {
	if (typeof crypto < "u" && crypto.randomUUID) return crypto.randomUUID();
	let e = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(e), e[6] = e[6] & 15 | 64, e[8] = e[8] & 63 | 128;
	let t = Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("");
	return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
}
//#endregion
//#region src/lib/snowflake.ts
var C = 14200704e5, st = /^\d{17,20}$/;
function ct(e) {
	return st.test(e.trim());
}
function lt(e) {
	let t = e.trim();
	if (!ct(t)) throw Error("A Discord snowflake is 17-20 digits long, all numeric. Check the value and try again.");
	let n = BigInt(t), r = Number((n >> 22n) + BigInt(C)), i = new Date(r);
	if (Number.isNaN(i.getTime())) throw Error("That ID does not decode to a valid date.");
	return {
		id: t,
		timestamp: r,
		date: i,
		workerId: Number((n & 4063232n) >> 17n),
		processId: Number((n & 126976n) >> 12n),
		increment: Number(n & 4095n)
	};
}
function ut(e, t = 1, n = 0, r = 0) {
	let i = BigInt(e.getTime());
	if (i < BigInt(14200704e5)) throw Error("Date must be after 2015-01-01, the Discord epoch.");
	if (r < 0 || r > 1023) throw Error("Increment must be between 0 and 1023.");
	return (i - BigInt(C) << 22n | BigInt(t & 31) << 17n | BigInt(n & 31) << 12n | BigInt(r & 255)).toString();
}
function dt(e) {
	let t = Date.now() - e.getTime();
	if (t < 0) return "in the future";
	let n = Math.floor(t / 1e3);
	if (n < 60) return `${n} second${n === 1 ? "" : "s"} ago`;
	let r = Math.floor(n / 60);
	if (r < 60) return `${r} minute${r === 1 ? "" : "s"} ago`;
	let i = Math.floor(r / 60);
	if (i < 24) return `${i} hour${i === 1 ? "" : "s"} ago`;
	let a = Math.floor(i / 24);
	if (a < 31) return `${a} day${a === 1 ? "" : "s"} ago`;
	let o = Math.floor(a / 30.44);
	if (o < 12) return `${o} month${o === 1 ? "" : "s"} ago`;
	let s = Math.floor(a / 365.25), c = Math.floor((a - s * 365.25) / 30.44), l = `${s} year${s === 1 ? "" : "s"}`;
	return c > 0 ? `${l}, ${c} mo ago` : `${l} ago`;
}
//#endregion
//#region src/lib/rpc.ts
var w = [
	{
		id: "playing",
		label: "Playing",
		allowsTimestamp: !0
	},
	{
		id: "listening",
		label: "Listening to",
		allowsTimestamp: !0
	},
	{
		id: "watching",
		label: "Watching",
		allowsTimestamp: !0
	},
	{
		id: "streaming",
		label: "Streaming",
		allowsTimestamp: !0
	}
], ft = 4, pt = {
	playing: 0,
	streaming: 1,
	listening: 2,
	watching: 3,
	custom: 4,
	competing: 5
};
function mt(e) {
	return w.find((t) => t.id === e) ?? w[0];
}
function ht(e) {
	let t = mt(e.verb), n = e.text.trim(), r = e.state?.trim() ?? "";
	if (n === "") throw Error("Add some text before building a presence.");
	let i = {
		type: t.id === "playing" ? pt.playing : ft,
		name: t.label,
		state: n
	};
	r !== "" && (i.details = r), e.startedAt !== void 0 && (i.timestamps = { start: e.startedAt });
	let a = {};
	e.largeImage && (a.large_image = e.largeImage), e.largeText && (a.large_text = e.largeText), e.smallImage && (a.small_image = e.smallImage), e.smallText && (a.small_text = e.smallText), Object.keys(a).length > 0 && (i.assets = a);
	let o = {
		presence: {
			activities: [i],
			status: "online"
		},
		display: `${t.label} ${n}`
	};
	return r !== "" && (o.display += `\n${r}`), o;
}
//#endregion
//#region src/lib/core/time.ts
function gt(e) {
	let t = e.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?$/);
	if (!t) return 0;
	let [, n, r, i, a] = t;
	return (n ? Number(n) : 0) * 3600 + Number(r) * 60 + Number(i) + (a ? Number(`0.${a}`) : 0);
}
function _t(e) {
	let t = Math.max(0, Math.floor(e)), n = Math.floor(t / 86400), r = Math.floor(t % 86400 / 3600), i = Math.floor(t % 3600 / 60), a = t % 60, o = (e) => String(e).padStart(2, "0");
	return n > 0 ? `${n}d ${o(r)}:${o(i)}:${o(a)}` : `${o(r)}:${o(i)}:${o(a)}`;
}
var vt = 864e5, yt = 30.436875;
function T(e) {
	let t = e.trim();
	if (!t) throw Error("Provide a date.");
	let n = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
	if (n) {
		let [, e, t, r] = n, i = new Date(Date.UTC(Number(e), Number(t) - 1, Number(r)));
		if (Number.isNaN(i.getTime())) throw Error("That date does not exist.");
		return i;
	}
	let r = new Date(t);
	if (Number.isNaN(r.getTime())) throw Error("Use YYYY-MM-DD, or an ISO timestamp.");
	return r;
}
function bt(e, t) {
	if (e.getTime() > t.getTime()) throw Error("The birth date is after the reference date.");
	let n = t.getTime() - e.getTime(), r = Math.floor(n / vt), i = t.getUTCFullYear() - e.getUTCFullYear(), a = t.getUTCMonth() - e.getUTCMonth(), o = t.getUTCDate() - e.getUTCDate();
	o < 0 && (--a, o += new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 0)).getUTCDate()), a < 0 && (--i, a += 12);
	let s = new Date(Date.UTC(t.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
	return s.getTime() < t.getTime() && s.setUTCFullYear(s.getUTCFullYear() + 1), {
		birthIso: e.toISOString(),
		referenceIso: t.toISOString(),
		totalMs: n,
		years: i,
		months: a,
		days: o,
		totalDays: r,
		totalWeeks: Math.floor(r / 7),
		totalMonths: Math.floor(r / yt),
		totalHours: Math.floor(n / 36e5),
		totalMinutes: Math.floor(n / 6e4),
		leapDays: Math.floor((t.getUTCFullYear() - e.getUTCFullYear()) / 4),
		nextBirthdayInDays: Math.ceil((s.getTime() - t.getTime()) / vt),
		weekday: e.toUTCString().slice(0, 3),
		bornOn: e.toISOString().slice(0, 10),
		zodiac: St(e)
	};
}
var xt = [
	[
		"Capricorn",
		12,
		22
	],
	[
		"Aquarius",
		1,
		20
	],
	[
		"Pisces",
		2,
		19
	],
	[
		"Aries",
		3,
		21
	],
	[
		"Taurus",
		4,
		20
	],
	[
		"Gemini",
		5,
		21
	],
	[
		"Cancer",
		6,
		21
	],
	[
		"Leo",
		7,
		23
	],
	[
		"Virgo",
		8,
		23
	],
	[
		"Libra",
		9,
		23
	],
	[
		"Scorpio",
		10,
		23
	],
	[
		"Sagittarius",
		11,
		22
	]
];
function St(e) {
	let t = e.getUTCMonth() + 1, n = e.getUTCDate(), r = xt.filter(([, e, r]) => t === e && n >= r);
	return r.length > 0 ? r[0][0] : t === 12 ? "Capricorn" : "Sagittarius";
}
//#endregion
//#region src/lib/sound.ts
var E = [
	{
		id: "notification",
		name: "Notification",
		group: "Alerts",
		description: "Two-tone chime, closest thing to the real one.",
		duration: .55,
		tones: [{
			freq: 1174.7,
			type: "sine",
			at: 0,
			dur: .16,
			gain: .32
		}, {
			freq: 1567.98,
			type: "sine",
			at: .13,
			dur: .34,
			gain: .3
		}]
	},
	{
		id: "message",
		name: "Message sent",
		group: "Alerts",
		description: "Short bright blip when a message goes out.",
		duration: .3,
		tones: [{
			freq: 880,
			type: "triangle",
			at: 0,
			dur: .07,
			gain: .26
		}, {
			freq: 1318.5,
			type: "triangle",
			at: .05,
			dur: .12,
			gain: .22
		}]
	},
	{
		id: "success",
		name: "Success",
		group: "Alerts",
		description: "Rising major triad.",
		duration: .7,
		tones: [
			{
				freq: 523.25,
				type: "sine",
				at: 0,
				dur: .18,
				gain: .24
			},
			{
				freq: 659.25,
				type: "sine",
				at: .11,
				dur: .18,
				gain: .24
			},
			{
				freq: 783.99,
				type: "sine",
				at: .22,
				dur: .36,
				gain: .24
			}
		]
	},
	{
		id: "error",
		name: "Error",
		group: "Alerts",
		description: "Falling buzzer.",
		duration: .5,
		tones: [{
			freq: 220,
			type: "sawtooth",
			at: 0,
			dur: .2,
			gain: .16,
			glideTo: 160
		}, {
			freq: 220,
			type: "sawtooth",
			at: .16,
			dur: .28,
			gain: .14,
			glideTo: 110
		}]
	},
	{
		id: "alert",
		name: "Alert",
		group: "Alerts",
		description: "Urgent triple beep.",
		duration: .7,
		tones: [
			{
				freq: 1046.5,
				type: "square",
				at: 0,
				dur: .09,
				gain: .13
			},
			{
				freq: 1046.5,
				type: "square",
				at: .14,
				dur: .09,
				gain: .13
			},
			{
				freq: 1046.5,
				type: "square",
				at: .28,
				dur: .14,
				gain: .13
			}
		]
	},
	{
		id: "ping",
		name: "Mention",
		group: "Alerts",
		description: "Double tap used for pings.",
		duration: .4,
		tones: [{
			freq: 987.77,
			type: "sine",
			at: 0,
			dur: .1,
			gain: .28
		}, {
			freq: 987.77,
			type: "sine",
			at: .15,
			dur: .2,
			gain: .26
		}]
	},
	{
		id: "join",
		name: "Member joined",
		group: "Server",
		description: "Playful upward leap.",
		duration: .5,
		tones: [
			{
				freq: 392,
				type: "triangle",
				at: 0,
				dur: .12,
				gain: .22
			},
			{
				freq: 587.33,
				type: "triangle",
				at: .09,
				dur: .12,
				gain: .22
			},
			{
				freq: 783.99,
				type: "triangle",
				at: .18,
				dur: .26,
				gain: .22
			}
		]
	},
	{
		id: "leave",
		name: "Member left",
		group: "Server",
		description: "Same shape, falling.",
		duration: .5,
		tones: [
			{
				freq: 783.99,
				type: "triangle",
				at: 0,
				dur: .12,
				gain: .2
			},
			{
				freq: 587.33,
				type: "triangle",
				at: .09,
				dur: .12,
				gain: .2
			},
			{
				freq: 392,
				type: "triangle",
				at: .18,
				dur: .28,
				gain: .2
			}
		]
	},
	{
		id: "levelup",
		name: "Level up",
		group: "Server",
		description: "Muted RPG fanfare.",
		duration: 1,
		tones: [
			{
				freq: 523.25,
				type: "square",
				at: 0,
				dur: .1,
				gain: .11
			},
			{
				freq: 659.25,
				type: "square",
				at: .1,
				dur: .1,
				gain: .11
			},
			{
				freq: 783.99,
				type: "square",
				at: .2,
				dur: .1,
				gain: .11
			},
			{
				freq: 1046.5,
				type: "square",
				at: .3,
				dur: .42,
				gain: .12
			}
		]
	},
	{
		id: "coin",
		name: "Coin",
		group: "Retro",
		description: "Two-note arcade pickup.",
		duration: .4,
		tones: [{
			freq: 987.77,
			type: "square",
			at: 0,
			dur: .06,
			gain: .14
		}, {
			freq: 1318.5,
			type: "square",
			at: .06,
			dur: .26,
			gain: .14
		}]
	},
	{
		id: "pop",
		name: "Pop",
		group: "Retro",
		description: "Short bubbly click.",
		duration: .18,
		tones: [{
			freq: 500,
			type: "sine",
			at: 0,
			dur: .1,
			gain: .26,
			glideTo: 1400
		}]
	},
	{
		id: "click",
		name: "Click",
		group: "Retro",
		description: "Dry UI tick.",
		duration: .07,
		noise: [{
			at: 0,
			dur: .05,
			gain: .18,
			type: "highpass",
			from: 1800,
			to: 2600
		}]
	},
	{
		id: "bonk",
		name: "Bonk",
		group: "Memes",
		description: "Wooden hollow thud.",
		duration: .35,
		tones: [{
			freq: 196,
			type: "triangle",
			at: 0,
			dur: .16,
			gain: .3,
			glideTo: 90
		}, {
			freq: 98,
			type: "sine",
			at: .01,
			dur: .3,
			gain: .26
		}],
		noise: [{
			at: 0,
			dur: .05,
			gain: .1,
			type: "lowpass",
			from: 1200,
			to: 400
		}]
	},
	{
		id: "vine",
		name: "Vine boom",
		group: "Memes",
		description: "The one and only.",
		duration: 1.1,
		tones: [{
			freq: 130,
			type: "sawtooth",
			at: 0,
			dur: .5,
			gain: .2,
			glideTo: 42
		}, {
			freq: 65,
			type: "sine",
			at: .02,
			dur: .9,
			gain: .24
		}],
		noise: [{
			at: 0,
			dur: .35,
			gain: .07,
			type: "lowpass",
			from: 900,
			to: 120
		}]
	},
	{
		id: "airhorn",
		name: "Airhorn",
		group: "Memes",
		description: "Three blasts. Please be a neighbour about it.",
		duration: 1.4,
		tones: [
			{
				freq: 233,
				type: "sawtooth",
				at: 0,
				dur: .28,
				gain: .13
			},
			{
				freq: 233,
				type: "square",
				at: 0,
				dur: .28,
				gain: .07
			},
			{
				freq: 233,
				type: "sawtooth",
				at: .36,
				dur: .28,
				gain: .13
			},
			{
				freq: 233,
				type: "square",
				at: .36,
				dur: .28,
				gain: .07
			},
			{
				freq: 233,
				type: "sawtooth",
				at: .72,
				dur: .5,
				gain: .13
			},
			{
				freq: 233,
				type: "square",
				at: .72,
				dur: .5,
				gain: .07
			}
		]
	},
	{
		id: "scratch",
		name: "Record scratch",
		group: "Memes",
		description: "Wait, what were we doing.",
		duration: .9,
		tones: [{
			freq: 900,
			type: "sawtooth",
			at: 0,
			dur: .22,
			gain: .1,
			glideTo: 260
		}, {
			freq: 300,
			type: "sawtooth",
			at: .24,
			dur: .5,
			gain: .13,
			glideTo: 210
		}],
		noise: [{
			at: 0,
			dur: .22,
			gain: .1,
			type: "bandpass",
			from: 2600,
			to: 700
		}]
	},
	{
		id: "whoosh",
		name: "Whoosh",
		group: "Transitions",
		description: "Swept air.",
		duration: .45,
		noise: [{
			at: 0,
			dur: .42,
			gain: .13,
			type: "bandpass",
			from: 400,
			to: 3e3
		}]
	},
	{
		id: "swoosh",
		name: "Swoosh",
		group: "Transitions",
		description: "Fast reversed sweep.",
		duration: .35,
		noise: [{
			at: 0,
			dur: .32,
			gain: .13,
			type: "bandpass",
			from: 3200,
			to: 350
		}]
	},
	{
		id: "laser",
		name: "Laser",
		group: "Transitions",
		description: "Descending zap.",
		duration: .45,
		tones: [{
			freq: 1800,
			type: "sawtooth",
			at: 0,
			dur: .4,
			gain: .12,
			glideTo: 180
		}]
	},
	{
		id: "riser",
		name: "Riser",
		group: "Transitions",
		description: "Tension building into nothing.",
		duration: 1.6,
		tones: [{
			freq: 160,
			type: "sawtooth",
			at: 0,
			dur: 1.5,
			gain: .09,
			glideTo: 1400
		}],
		noise: [{
			at: 0,
			dur: 1.5,
			gain: .05,
			type: "highpass",
			from: 600,
			to: 4200
		}]
	},
	{
		id: "boop",
		name: "Boop",
		group: "Retro",
		description: "Tiptoe tap.",
		duration: .3,
		tones: [{
			freq: 660,
			type: "sine",
			at: 0,
			dur: .11,
			gain: .26
		}, {
			freq: 990,
			type: "sine",
			at: .07,
			dur: .18,
			gain: .2
		}]
	},
	{
		id: "kick",
		name: "Kick drum",
		group: "Drums",
		description: "Low thump with pitch drop.",
		duration: .35,
		tones: [{
			freq: 160,
			type: "sine",
			at: 0,
			dur: .3,
			gain: .34,
			glideTo: 45
		}],
		noise: [{
			at: 0,
			dur: .02,
			gain: .14,
			type: "lowpass",
			from: 3e3,
			to: 800
		}]
	},
	{
		id: "snare",
		name: "Snare",
		group: "Drums",
		description: "Crack of a snare.",
		duration: .25,
		noise: [{
			at: 0,
			dur: .16,
			gain: .2,
			type: "bandpass",
			from: 1800,
			to: 900
		}, {
			at: 0,
			dur: .06,
			gain: .12,
			type: "highpass",
			from: 4e3,
			to: 3e3
		}],
		tones: [{
			freq: 220,
			type: "triangle",
			at: 0,
			dur: .1,
			gain: .14,
			glideTo: 150
		}]
	},
	{
		id: "hat",
		name: "Hi-hat",
		group: "Drums",
		description: "Closed metallic tick.",
		duration: .12,
		noise: [{
			at: 0,
			dur: .09,
			gain: .16,
			type: "highpass",
			from: 7e3,
			to: 6e3
		}]
	},
	{
		id: "taiko",
		name: "Taiko",
		group: "Drums",
		description: "Deep ceremonial drum.",
		duration: .6,
		tones: [{
			freq: 110,
			type: "sine",
			at: 0,
			dur: .5,
			gain: .36,
			glideTo: 60
		}, {
			freq: 220,
			type: "triangle",
			at: 0,
			dur: .2,
			gain: .16,
			glideTo: 120
		}]
	}
];
Array.from(new Set(E.map((e) => e.group)));
//#endregion
//#region src/lib/emojiData.ts
function D(e, t, n, r = []) {
	return {
		char: e,
		name: t,
		category: n,
		keywords: r.length > 0 ? r : [t]
	};
}
var O = [
	"Smileys",
	"Gestures",
	"People",
	"Animals",
	"Food",
	"Activity",
	"Travel",
	"Objects",
	"Symbols",
	"Flags"
], Ct = [
	D("😀", "grinning", "Smileys", [
		"smile",
		"happy",
		"face"
	]),
	D("😃", "smiley", "Smileys", [
		"happy",
		"face",
		" grin"
	]),
	D("😄", "smile", "Smileys", [
		"happy",
		"face",
		" teeth"
	]),
	D("😁", "grin", "Smileys", [
		"happy",
		"face",
		"big"
	]),
	D("😆", "laughing", "Smileys", [
		"haha",
		"lol",
		"face"
	]),
	D("😅", "sweat_smile", "Smileys", [
		"hot",
		"face",
		" relief"
	]),
	D("🤣", "rofl", "Smileys", [
		"rolling",
		"laugh",
		"lol",
		"face"
	]),
	D("😂", "joy", "Smileys", [
		"tears",
		"laugh",
		"face"
	]),
	D("🙂", "slightly_smiling_face", "Smileys", ["smile", "face"]),
	D("🙃", "upside_down_face", "Smileys", [
		"sarcasm",
		"irony",
		"face"
	]),
	D("🫠", "melting_face", "Smileys", [
		"hot",
		"drip",
		"face"
	]),
	D("😉", "wink", "Smileys", ["face", " flirt"]),
	D("😊", "blush", "Smileys", [
		"shy",
		"face",
		" cute"
	]),
	D("😇", "smiling_imp", "Smileys", [
		"devil",
		"mischief",
		"face"
	]),
	D("🥰", "smiling_face_with_three_hearts", "Smileys", [
		"love",
		"face",
		" adore"
	]),
	D("😍", "heart_eyes", "Smileys", [
		"love",
		"crush",
		"face"
	]),
	D("🤩", "star_struck", "Smileys", [
		"wow",
		"amazed",
		"face"
	]),
	D("😘", "kissing_heart", "Smileys", [
		"love",
		"face",
		" kiss"
	]),
	D("😗", "kissing", "Smileys", ["kiss", "face"]),
	D("😚", "kissing_closed_eyes", "Smileys", [
		"kiss",
		"face",
		" love"
	]),
	D("😙", "kissing_smiling_eyes", "Smileys", [
		"kiss",
		"face",
		" love"
	]),
	D("😋", "yum", "Smileys", [
		"tasty",
		"delicious",
		"face"
	]),
	D("😛", "stuck_out_tongue", "Smileys", [
		"tongue",
		"playful",
		"face"
	]),
	D("😜", "stuck_out_tongue_winking_eye", "Smileys", [
		"tongue",
		"joke",
		"face"
	]),
	D("🤪", "zany_face", "Smileys", [
		"crazy",
		"goofy",
		"face"
	]),
	D("😟", "hugging_face", "Smileys", [
		"hug",
		"warm",
		"face"
	]),
	D("🥲", "smiling_face_with_tear", "Smileys", [
		"upset",
		"relieved",
		"face"
	]),
	D("😏", "smirking_face", "Smileys", ["smug", "face"]),
	D("😒", "unamused", "Smileys", [
		"deadpan",
		"annoyed",
		"face"
	]),
	D("🙄", "face_with_rolling_eyes", "Smileys", [
		"eyeroll",
		"ugh",
		"face"
	]),
	D("😬", "grimacing", "Smileys", [
		"awkward",
		"eek",
		"face"
	]),
	D("🤥", "lying_face", "Smileys", [
		"pinocchio",
		"liar",
		"face"
	]),
	D("😌", "relieved", "Smileys", [
		"calm",
		"phew",
		"face"
	]),
	D("😔", "pensive", "Smileys", [
		"sad",
		"thoughtful",
		"face"
	]),
	D("😪", "sleepy", "Smileys", [
		"tired",
		"drowsy",
		"face"
	]),
	D("🤤", "drooling_face", "Smileys", [
		"hungry",
		"want",
		"face"
	]),
	D("😴", "sleeping", "Smileys", [
		"zzz",
		"asleep",
		"face"
	]),
	D("😷", "mask", "Smileys", [
		"sick",
		"ill",
		"face"
	]),
	D("🤒", "face_with_thermometer", "Smileys", [
		"sick",
		"fever",
		"face"
	]),
	D("🤕", "face_with_head_bandage", "Smileys", [
		"hurt",
		"injured",
		"face"
	]),
	D("🤢", "nauseated_face", "Smileys", [
		"sick",
		"gross",
		"face"
	]),
	D("🤮", "face_vomiting", "Smileys", [
		"sick",
		"puke",
		"face"
	]),
	D("🤧", "sneezing_face", "Smileys", [
		"achoo",
		"sick",
		"face"
	]),
	D("🥵", "hot_face", "Smileys", [
		"heat",
		"sweltering",
		"face"
	]),
	D("🥶", "cold_face", "Smileys", [
		"freezing",
		"chilly",
		"face"
	]),
	D("🥴", "woozy_face", "Smileys", [
		"drunk",
		"woozy",
		"face"
	]),
	D("😵", "dizzy_face", "Smileys", [
		"knocked",
		"confused",
		"face"
	]),
	D("🤯", "exploding_head", "Smileys", [
		"mind blown",
		"wow",
		"face"
	]),
	D("🤠", "cowboy_hat_face", "Smileys", [
		"cowboy",
		"hat",
		"face"
	]),
	D("🥳", "partying_face", "Smileys", [
		"celebrate",
		"party",
		"face"
	]),
	D("😎", "smiling_face_with_sunglasses", "Smileys", [
		"cool",
		"sunglasses",
		"face"
	]),
	D("🤓", "nerd_face", "Smileys", [
		"geek",
		"glasses",
		"face"
	]),
	D("🧐", "face_with_monocle", "Smileys", [
		"fancy",
		"inspect",
		"face"
	]),
	D("😕", "confused", "Smileys", [
		"huh",
		"puzzled",
		"face"
	]),
	D("😟", "hugs", "Smileys"),
	D("😳", "flushed", "Smileys", [
		"blush",
		"red",
		"face"
	]),
	D("🥺", "pleading_face", "Smileys", [
		"puppy eyes",
		"beg",
		"face"
	]),
	D("😦", "frowning_face", "Smileys", [
		"frown",
		"upset",
		"face"
	]),
	D("😧", "anguished", "Smileys", [
		"anguish",
		"pain",
		"face"
	]),
	D("😨", "fearful", "Smileys", [
		"scared",
		"afraid",
		"face"
	]),
	D("😰", "cold_sweat", "Smileys", [
		"nervous",
		"scared",
		"face"
	]),
	D("😥", "sad", "Smileys", [
		"frown",
		"cry",
		"face"
	]),
	D("😢", "cry", "Smileys", [
		"tears",
		"sad",
		"face"
	]),
	D("😭", "loudly_crying_face", "Smileys", [
		"sob",
		"bawling",
		"face"
	]),
	D("😱", "scream", "Smileys", [
		"fear",
		"shock",
		"face"
	]),
	D("😖", "confounded", "Smileys", [
		"frustrated",
		"aggravated",
		"face"
	]),
	D("😣", "persevere", "Smileys", [
		"struggle",
		"determined",
		"face"
	]),
	D("😞", "disappointed", "Smileys", [
		"sad",
		"down",
		"face"
	]),
	D("😓", "sweat", "Smileys", [
		"nervous",
		"phew",
		"face"
	]),
	D("😩", "weary", "Smileys", [
		"tired",
		"exhausted",
		"face"
	]),
	D("😫", "tired_face", "Smileys", [
		"exhausted",
		"fed up",
		"face"
	]),
	D("😤", "triumph", "Smileys", [
		"huff",
		"smug",
		"face"
	]),
	D("😡", "rage", "Smileys", [
		"pissed",
		"angry",
		"face"
	]),
	D("😠", "angry", "Smileys", [
		"mad",
		"annoyed",
		"face"
	]),
	D("🤬", "cursing_face", "Smileys", [
		"swear",
		"angry",
		"face"
	]),
	D("😈", "smiling_face_with_horns", "Smileys", [
		"devil",
		"imp",
		"face"
	]),
	D("👿", "imp", "Smileys", ["devil", "horns"]),
	D("💀", "skull", "Smileys", [
		"dead",
		"death",
		"bones"
	]),
	D("☠", "skull_and_crossbones", "Smileys", [
		"dead",
		"danger",
		"bones"
	]),
	D("💩", "poop", "Smileys", [
		"pile",
		"turd",
		"shit"
	]),
	D("🤡", "clown_face", "Smileys", [
		"clown",
		"circus",
		"face"
	]),
	D("👹", "ogre", "Smileys", [
		"monster",
		"japanese",
		"face"
	]),
	D("👺", "goblin", "Smileys", [
		"monster",
		"japanese",
		"face"
	]),
	D("👻", "ghost", "Smileys", [
		"halloween",
		"spooky",
		"boo"
	]),
	D("👽", "alien", "Smileys", [
		"ufo",
		"space",
		"extraterrestrial"
	]),
	D("🤖", "robot", "Smileys", [
		"bot",
		"machine",
		"android"
	]),
	D("😺", "grinning_cat", "Smileys", [
		"cat",
		"smile",
		"happy"
	]),
	D("😸", "grinning_cat_with_wide_eyes", "Smileys", [
		"cat",
		"smile",
		"happy"
	]),
	D("😹", "cat_with_tears_of_joy", "Smileys", [
		"cat",
		"laugh",
		"lol"
	]),
	D("😻", "smiling_cat_with_heart_eyes", "Smileys", [
		"cat",
		"love",
		"kiss"
	]),
	D("😼", "cat_with_wry_smile", "Smileys", [
		"cat",
		"smile",
		"ironic"
	]),
	D("😽", "kissing_cat", "Smileys", [
		"cat",
		"kiss",
		"love"
	]),
	D("🙀", "weary_cat", "Smileys", [
		"cat",
		"tired",
		"unamused"
	]),
	D("😿", "crying_cat", "Smileys", [
		"cat",
		"cry",
		"sad"
	]),
	D("😾", "pouting_cat", "Smileys", [
		"cat",
		"angry",
		"grumpy"
	]),
	D("🙈", "see_no_evil_monkey", "Smileys", [
		"monkey",
		"hide",
		"haha"
	]),
	D("🙉", "hear_no_evil_monkey", "Smileys", [
		"monkey",
		"ears",
		"haha"
	]),
	D("🙊", "speak_no_evil_monkey", "Smileys", [
		"monkey",
		"hush",
		"haha"
	]),
	D("💋", "kiss_mark", "Smileys", [
		"lipstick",
		"beauty",
		"kiss"
	]),
	D("💌", "couple_with_heart", "Smileys", ["love", "relationship"]),
	D("💘", "coupleheart", "Smileys", [
		"love",
		"relationship",
		" pink"
	]),
	D("💝", "heart_with_ribbon", "Smileys", [
		"love",
		"gift",
		"valentine"
	]),
	D("💞", "revolving_hearts", "Smileys", ["love", "affection"]),
	D("💜", "heart_decoration", "Smileys", [
		"love",
		"affection",
		" purple"
	]),
	D("🖤", "black_heart", "Smileys", ["love", "dark"]),
	D("❤️", "heart", "Smileys", ["love", "red"]),
	D("🧡", "orange_heart", "Smileys", ["love", "orange"]),
	D("💛", "yellow_heart", "Smileys", ["love", "yellow"]),
	D("💚", "green_heart", "Smileys", ["love", "green"]),
	D("💙", "blue_heart", "Smileys", ["love", "blue"]),
	D("🩵", "light_blue_heart", "Smileys", ["love", "cyan"]),
	D("💜", "purple_heart", "Smileys", ["love", "purple"]),
	D("🤎", "brown_heart", "Smileys", ["love", "brown"]),
	D("🤍", "white_heart", "Smileys", ["love", "white"]),
	D("💔", "broken_heart", "Smileys", ["sad", "heartbreak"]),
	D("❣️", "heart_exclamation", "Smileys", ["love", "decoration"]),
	D("💕", "two_hearts", "Smileys", [
		"love",
		"affection",
		" purple"
	]),
	D("💖", "sparkling_heart", "Smileys", [
		"love",
		"shiny",
		"affection"
	]),
	D("💗", "growing_heart", "Smileys", ["love", "affection"]),
	D("💯", "hundred", "Smileys", [
		"100",
		"score",
		"perfect"
	]),
	D("💢", "anger", "Smileys", ["angry", "mad"]),
	D("💥", "boom", "Smileys", [
		"collision",
		"explosion",
		"anger"
	]),
	D("💫", "dizzy", "Smileys", [
		"star",
		"shoot",
		"sparkle"
	]),
	D("💦", "sweat_drops", "Smileys", ["water", "splashed"]),
	D("💨", "dashing_away", "Smileys", [
		"fast",
		"run",
		"wind"
	]),
	D("🕳", "hole", "Smileys", ["circle", "spot"]),
	D("💬", "speech_balloon", "Smileys", [
		"comment",
		"talk",
		" message"
	]),
	D("👁️", "eyes", "Smileys", [
		"look",
		"watch",
		"see"
	]),
	D("👀", "eyes", "Smileys", [
		"look",
		"watch",
		"see"
	]),
	D("👅", "tongue", "Smileys", ["taste", "lick"]),
	D("👄", "mouth", "Smileys", [
		"eat",
		"kiss",
		"yum"
	]),
	D("🫦", "face_with_open_eyes_and_hand_over_mouth", "Smileys", [
		"oops",
		"gossip",
		" face"
	]),
	D("🫧", "face_with_peeking_eye", "Smileys", [
		"peek",
		"watch",
		" face"
	]),
	D("🤭", "hand_over_mouth", "Smileys", [
		"oops",
		"silence",
		" face"
	]),
	D("🫣", "melting", "Smileys", [
		"drip",
		"hot",
		" face"
	]),
	D("😶", "no_mouth", "Smileys", [
		"silent",
		"quiet",
		"face"
	]),
	D("😏️", "smirk", "Smileys", ["smug", "face"])
], wt = [
	D("👋", "wave", "Gestures", [
		"hello",
		"hi",
		"bye",
		"hand"
	]),
	D("🤚", "raised_back_of_hand", "Gestures", ["hand", "palm"]),
	D("🖐️", "hand_with_fingers_splayed", "Gestures", [
		"hand",
		"fingers",
		"spread"
	]),
	D("✋", "raised_hand", "Gestures", [
		"stop",
		"hand",
		"high five"
	]),
	D("🖖", "vulcan_salute", "Gestures", [
		"spock",
		"star trek",
		"hand"
	]),
	D("🫱", "rightwards_hand", "Gestures", ["point", "direction"]),
	D("🫲", "leftwards_hand", "Gestures", ["point", "direction"]),
	D("🫳", "palm_down_hand", "Gestures", [
		"calm",
		"low",
		"hand"
	]),
	D("🫴", "palm_up_hand", "Gestures", [
		"joker",
		"money",
		"hand"
	]),
	D("👌", "ok_hand", "Gestures", [
		"okay",
		"perfect",
		"hand"
	]),
	D("✌", "v", "Gestures", [
		"peace",
		"victory",
		"two"
	]),
	D("🤞", "crossed_fingers", "Gestures", [
		"luck",
		"hope",
		"hand"
	]),
	D("🤟", "love_you_gesture", "Gestures", ["ily", "hand"]),
	D("🤘", "sign_of_the_horns", "Gestures", [
		"rock",
		"metal",
		"hand"
	]),
	D("🤙", "call_me_hand", "Gestures", [
		"shaka",
		"phone",
		"hand"
	]),
	D("👈", "point_left", "Gestures", ["direction", "finger"]),
	D("👉", "point_right", "Gestures", ["direction", "finger"]),
	D("👆", "point_up_2", "Gestures", [
		"direction",
		"finger",
		" two"
	]),
	D("👇", "point_down", "Gestures", ["direction", "finger"]),
	D("🫵", "index_pointing_at_the_viewer", "Gestures", ["point", "you"]),
	D("👍", "thumbsup", "Gestures", [
		"like",
		"yes",
		"approve",
		"hand"
	]),
	D("👎", "thumbsdown", "Gestures", [
		"dislike",
		"no",
		"hand"
	]),
	D("👏", "clap", "Gestures", [
		"applause",
		"praise",
		"hands"
	]),
	D("🙌", "raising_hands", "Gestures", [
		"celebrate",
		"praise",
		"hooray"
	]),
	D("👐", "open_hands", "Gestures", [
		"hug",
		"jazz",
		"hands"
	]),
	D("🤲", "palms_up_together", "Gestures", [
		"praise",
		"pray",
		" hands"
	]),
	D("🤝", "handshake", "Gestures", [
		"deal",
		"agreement",
		"shake"
	]),
	D("🙏", "folded_hands", "Gestures", [
		"pray",
		"thanks",
		"please",
		"please"
	]),
	D("💪", "muscle", "Gestures", [
		"strong",
		"flex",
		"arm"
	]),
	D("💣", "bomb", "Gestures", ["explode", "fire"]),
	D("👊", "punch", "Gestures", ["fist", "fist bump"]),
	D("🤛", "left_facing_fist", "Gestures", ["fist", "punch"]),
	D("🤜", "right_facing_fist", "Gestures", ["fist", "punch"]),
	D("👋️", "wave", "Gestures", ["hello", "bye"]),
	D("🤚️", "raised_back_of_hand", "Gestures", ["hand"]),
	D("🖕", "middle_finger", "Gestures", [
		"flipping",
		"rude",
		"hand"
	]),
	D("🤘️", "metal", "Gestures", ["rock", "hand"]),
	D("🤦", "facepalm", "Gestures", [
		"disbelief",
		"hand",
		" face"
	]),
	D("🫶", "handshake", "Gestures", ["deal"]),
	D("🫢", "hand_with_index_finger_and_thumb_crossed", "Gestures", [
		"heart",
		"love",
		"hand"
	]),
	D("🫷", "leftwards_pushing_hand", "Gestures", [
		"push",
		"stop",
		"hand"
	]),
	D("🫸", "rightwards_pushing_hand", "Gestures", [
		"push",
		"stop",
		"hand"
	]),
	D("👊️", "oncoming_fist", "Gestures", ["punch", "fist"])
], Tt = [
	D("👨", "man", "People", ["adult", "male"]),
	D("👩", "woman", "People", ["adult", "female"]),
	D("🧑", "person", "People", ["adult", "neutral"]),
	D("👦", "boy", "People", [
		"child",
		"young",
		"male"
	]),
	D("👧", "girl", "People", [
		"child",
		"young",
		"female"
	]),
	D("🧒", "child", "People", ["young", "neutral"]),
	D("👶", "baby", "People", ["child", "infant"]),
	D("🧓", "older_person", "People", ["elderly", "old"]),
	D("👴", "old_man", "People", ["elderly", "grandpa"]),
	D("👵", "old_woman", "People", ["elderly", "grandma"]),
	D("👪", "family", "People", ["parents", "group"]),
	D("👨‍👩‍👦", "family_man_woman_boy", "People", ["parents", "group"]),
	D("👩‍💻", "woman_technologist", "People", [
		"developer",
		"coding",
		"female"
	]),
	D("👨‍💻", "man_technologist", "People", [
		"developer",
		"coding",
		"male"
	]),
	D("🧙", "person_technologist", "People", ["developer", "coding"]),
	D("🧘", "person_in_tuxedo", "People", ["formal", "suit"]),
	D("🤵", "person_in_tuxedo", "People", ["formal", "suit"]),
	D("👰", "person_with_veil", "People", [
		"wedding",
		"bride",
		"formal"
	]),
	D("🤰", "pregnant_woman", "People", ["expecting", "baby"]),
	D("🤱", "breast_feeding", "People", ["baby", "feeding"]),
	D("👼", "baby_angel", "People", [
		"cherub",
		"cupid",
		"wing"
	]),
	D("🎅", "santa", "People", [
		"christmas",
		"xmas",
		"father"
	]),
	D("🤶", "ms_claus", "People", ["christmas", "mother"]),
	D("🦸", "superhero", "People", [
		"hero",
		"cape",
		"mask"
	]),
	D("🦹", "supervillain", "People", [
		"villain",
		"cape",
		"mask"
	]),
	D("🧙‍🚀", "astronaut", "People", ["space", "nasa"]),
	D("🚀", "rocket", "People", [
		"space",
		"launch",
		"ship"
	]),
	D("🕵️", "detective", "People", ["spy", "sherlock"]),
	D("👮", "police_officer", "People", [
		"cop",
		"law",
		"male"
	]),
	D("👷", "construction_worker", "People", ["builder", "work"]),
	D("💂", "guard", "People", ["security", "work"]),
	D("🥷", "ninja", "People", ["martial arts", "stealth"]),
	D("🧘‍⚕️", "health_worker", "People", [
		"doctor",
		"nurse",
		"medical"
	]),
	D("🧙‍⚕️", "person_health_worker", "People", ["doctor", "nurse"]),
	D("🧑‍🤝", "people_holding_hands", "People", ["couple", "friends"]),
	D("👫", "woman_and_man_holding_hands", "People", ["couple", "relationship"]),
	D("👬", "men_holding_hands", "People", ["couple", "friends"]),
	D("👭", "women_holding_hands", "People", ["couple", "friends"]),
	D("🧑", "adult", "People", ["grown", "neutral"]),
	D("👤", "bust_in_silhouette", "People", [
		"anonymous",
		"unknown",
		"user"
	]),
	D("👥", "busts_in_silhouette", "People", [
		"anonymous",
		"unknown",
		"users"
	]),
	D("👣", "footprints", "People", ["steps", "walk"]),
	D("🧔", "person_bald", "People", ["hair", "bald"]),
	D("🧓‍🌾", "farmer", "People", ["work", "agriculture"]),
	D("👴‍🔥", "old_man_white_hair", "People", ["elderly"]),
	D("🧗", "person_climbing", "People", ["climb", "sport"]),
	D("🤺", "person_fencing", "People", ["sport", "fencing"]),
	D("🏃", "person_running", "People", [
		"sport",
		"run",
		"marathon"
	]),
	D("⛹", "person_bouncing_ball", "People", ["sport", "basketball"]),
	D("🏋", "person_lifting_weights", "People", [
		"sport",
		"gym",
		"workout"
	]),
	D("🚶", "person_walking", "People", ["stroll", "walk"])
], Et = [
	D("🐵", "monkey_face", "Animals", ["ape", "monkey"]),
	D("🐒", "monkey", "Animals", ["ape"]),
	D("🦍", "gorilla", "Animals", ["ape", "strong"]),
	D("🐕", "dog", "Animals", ["puppy", "pet"]),
	D("🐶", "dog_face", "Animals", ["puppy", "pet"]),
	D("🐩", "poodle", "Animals", ["dog", "pet"]),
	D("🦊", "fox", "Animals", ["animal"]),
	D("🦝", "raccoon", "Animals", ["animal"]),
	D("🐱", "cat_face", "Animals", ["kitten", "pet"]),
	D("🐈", "cat", "Animals", ["kitten", "pet"]),
	D("🐈‍⬛", "black_cat", "Animals", [
		"cat",
		"luck",
		"lunar"
	]),
	D("🦁", "lion", "Animals", ["cat", "king"]),
	D("🐯", "tiger_face", "Animals", ["big cat"]),
	D("🐅", "tiger2", "Animals", ["big cat"]),
	D("🐆", "leopard", "Animals", ["big cat"]),
	D("🐴", "horse", "Animals", ["pony"]),
	D("🫎", "moose", "Animals", ["deer"]),
	D("ᾬ", "goose", "Animals", ["bird", "duck"]),
	D("🦅", "eagle", "Animals", ["bird", "fly"]),
	D("🦉", "owl", "Animals", ["bird", "night"]),
	D("🐸", "frog", "Animals", ["toad", "ribbit"]),
	D("🐊", "crocodile", "Animals", ["reptile", "alligator"]),
	D("🐢", "turtle", "Animals", ["slow", "tortoise"]),
	D("🦎", "lizard", "Animals", ["gecko", "reptile"]),
	D("🐍", "snake", "Animals", ["serpent", "reptile"]),
	D("🐳", "spouting_whale", "Animals", ["ocean"]),
	D("🐬", "dolphin", "Animals", ["ocean", "sea"]),
	D("🐟", "fish", "Animals", ["ocean", "sea"]),
	D("🐠", "tropical_fish", "Animals", ["ocean", "reef"]),
	D("🐬‍💨", "dolphin_fin", "Animals", ["ocean"]),
	D("🦐", "shrimp", "Animals", ["prawn", "ocean"]),
	D("🐡", "blowfish", "Animals", ["pufferfish", "ocean"]),
	D("🦈", "shark", "Animals", ["ocean"]),
	D("🐙", "octopus", "Animals", ["tentacles", "ocean"]),
	D("🐚", "spiral_shell", "Animals", ["ocean", "beach"]),
	D("🪸", "beaver", "Animals", ["dam"]),
	D("🪶", "feather", "Animals", ["bird", "quill"]),
	D("🐦", "bird", "Animals", ["tweet", "fly"]),
	D("🐧", "penguin", "Animals", ["bird", "antarctica"]),
	D("🕊", "dove", "Animals", ["peace", "bird"]),
	D("🦅️", "eagle", "Animals", ["bird"]),
	D("🦚", "peacock", "Animals", ["bird", "pride"]),
	D("🐸", "frog", "Animals", ["toad"]),
	D("🐢️", "turtle", "Animals", ["tortoise"]),
	D("🦋", "butterfly", "Animals", ["insect", "wing"]),
	D("🐛", "bug", "Animals", ["insect", "beetle"]),
	D("🐝", "honeybee", "Animals", ["bee", "insect"]),
	D("🪲", "beetle", "Animals", ["insect", "bug"]),
	D("🦊️", "fox", "Animals", ["animal"]),
	D("🐞", "lady_beetle", "Animals", [
		"bug",
		"insect",
		"ladybug"
	]),
	D("🕷️", "spider", "Animals", ["web", "arachnid"]),
	D("🕸️", "spider_web", "Animals", ["web"]),
	D("🐀", "rat", "Animals", ["rodent"]),
	D("🐹", "hamster", "Animals", ["pet", "rodent"]),
	D("🐰", "rabbit_face", "Animals", ["bunny", "pet"]),
	D("🐇", "rabbit", "Animals", ["bunny", "pet"]),
	D("🐿", "chipmunk", "Animals", ["squirrel"]),
	D("🦫", "beaver", "Animals", ["dam"]),
	D("🦔", "hedgehog", "Animals", ["spiky", "cute"]),
	D("🦇", "bat", "Animals", ["vampire", "night"]),
	D("🐻", "bear", "Animals", ["grizzly"]),
	D("🐻️", "bear", "Animals", ["grizzly"]),
	D("🐨", "koala", "Animals", ["australia", "cute"]),
	D("🐼", "panda", "Animals", ["bamboo", "cute"]),
	D("🦥", "sloth", "Animals", ["slow"]),
	D("🦦", "otter", "Animals", ["sea otter"]),
	D("🦕", "sauropod", "Animals", ["dinosaur", "long"]),
	D("🦖", "t_rex", "Animals", ["dinosaur", "trex"]),
	D("🐳", "spouting_whale", "Animals", ["ocean"]),
	D("🐏", "crocodile", "Animals", ["reptile"]),
	D("🌵", "cactus", "Animals", ["plant", "desert"])
], Dt = [
	D("🍎", "red_apple", "Food", ["fruit"]),
	D("🍌", "banana", "Food", ["fruit"]),
	D("🍉", "grapes", "Food", ["fruit"]),
	D("🍊", "tangerine", "Food", ["orange", "fruit"]),
	D("🍋", "lemon", "Food", ["fruit"]),
	D("🍍", "banana", "Food", ["fruit"]),
	D("🥭", "mango", "Food", ["fruit"]),
	D("🍎", "apple", "Food", ["fruit"]),
	D("🍓", "strawberry", "Food", ["fruit", "berry"]),
	D("🥞", "pancakes", "Food", ["breakfast", "syrup"]),
	D("🥐", "croissant", "Food", ["bread", "france"]),
	D("🍞", "bread", "Food", ["loaf", "toast"]),
	D("🧀", "cheese_wedge", "Food", ["dairy"]),
	D("🍖", "meat_on_bone", "Food", ["meat", "drumstick"]),
	D("🍗", "poultry_leg", "Food", ["meat", "chicken"]),
	D("🥩", "cut_of_meat", "Food", ["meat", "steak"]),
	D("🥓", "bacon", "Food", ["meat", "breakfast"]),
	D("🍔", "hamburger", "Food", ["burger", "fast food"]),
	D("🍟", "french_fries", "Food", ["fries", "fast food"]),
	D("🍕", "pizza", "Food", ["slice"]),
	D("🌭", "hot_dog", "Food", ["fast food"]),
	D("🥪", "sandwich", "Food", ["lunch"]),
	D("🌮", "taco", "Food", ["mexican"]),
	D("🌯", "burrito", "Food", ["mexican", "wrap"]),
	D("🥙", "stuffed_flatbread", "Food", ["pita"]),
	D("🧆", "falafel", "Food", ["chickpea"]),
	D("🥚", "egg", "Food", ["breakfast", "fried"]),
	D("🍳", "cooking", "Food", [
		"egg",
		"fried",
		"breakfast"
	]),
	D("🥘", "shallow_pan_of_food", "Food", ["egg", "cooking"]),
	D("🍲", "pot_of_food", "Food", ["stew", "soup"]),
	D("🫕", "fondue", "Food", ["cheese", "swiss"]),
	D("🥣", "bowl_with_spoon", "Food", ["cereal", "porridge"]),
	D("🥗", "green_salad", "Food", ["healthy", "lettuce"]),
	D("🍿", "popcorn", "Food", ["movie", "snack"]),
	D("🧂", "salt", "Food", ["seasoning"]),
	D("🥫", "canned_food", "Food", ["soup", "tin"]),
	D("🍱", "bento", "Food", ["japan", "lunch"]),
	D("🍘", "rice_cracker", "Food", ["snack"]),
	D("🍙", "rice_ball", "Food", ["onigiri", "japan"]),
	D("🍚", "cooked_rice", "Food", ["bowl", "rice"]),
	D("🍠", "roasted_sweet_potato", "Food", ["yam", "side"]),
	D("🍢", "oden", "Food", ["japan", "skewer"]),
	D("🍣", "sushi", "Food", ["japan", "fish"]),
	D("🍤", "fried_shrimp", "Food", ["japan", "tempura"]),
	D("🥜", "peanuts", "Food", ["nuts"]),
	D("🍭", "candy", "Food", ["sweet"]),
	D("🍬", "candy", "Food", ["sweet"]),
	D("🍫", "chocolate_bar", "Food", ["sweet"]),
	D("🍪", "cookie", "Food", ["biscuit", "sweet"]),
	D("🍩", "doughnut", "Food", ["donut", "sweet"]),
	D("🍯", "honey_pot", "Food", ["sweet", "bee"]),
	D("🧁", "shortcake", "Food", ["dessert", "cake"]),
	D("🍰", "shortcake", "Food", ["cake", "dessert"]),
	D("🧀", "cheese", "Food", ["dairy"]),
	D("🥛", "butter", "Food", ["dairy"]),
	D("🫒", "cupcake", "Food", ["cake", "dessert"]),
	D("🧁", "cake", "Food", ["dessert"]),
	D("🥧", "pie", "Food", ["dessert"]),
	D("🍯", "honey", "Food", ["sweet"]),
	D("🧄", "garlic", "Food", ["seasoning", "flavor"]),
	D("🧅", "onion", "Food", ["vegetable"]),
	D("🥬️", "leafy_green", "Food", ["vegetable"]),
	D("🥕", "carrot", "Food", ["vegetable"]),
	D("🌽", "ear_of_corn", "Food", ["vegetable"]),
	D("🌶️", "hot_pepper", "Food", ["spicy", "chili"]),
	D("🥒", "cucumber", "Food", ["vegetable", "pickle"]),
	D("🥦", "broccoli", "Food", ["vegetable"]),
	D("🧄️", "garlic", "Food", ["seasoning"]),
	D("🥔", "ginger", "Food", ["seasoning"]),
	D("🫑", "ginger", "Food", ["spicy"]),
	D("🫔️", "beans", "Food", ["legume"]),
	D("🍛", "dango", "Food", ["japan", "sweet"]),
	D("🫙️", "tamale", "Food", ["mexican"])
], Ot = [
	D("⚽", "soccer", "Activity", ["football", "ball"]),
	D("⚾", "baseball", "Activity", ["ball", "sport"]),
	D("🥎", "softball", "Activity", ["ball", "sport"]),
	D("🏀", "basketball", "Activity", ["hoop", "sport"]),
	D("🏈", "american_football", "Activity", ["nfl", "sport"]),
	D("🏁", "flag_in_hole", "Activity", ["golf", "sport"]),
	D("⛳", "golf", "Activity", ["sport", "flag"]),
	D("⛸", "ice_skate", "Activity", ["skating", "sport"]),
	D("🎣", "bowling", "Activity", ["sport", "strike"]),
	D("🏏", "cricket_game", "Activity", ["bat", "sport"]),
	D("🏑", "field_hockey", "Activity", ["sport"]),
	D("🏒", "ice_hockey", "Activity", ["sport"]),
	D("🥍", "lacrosse", "Activity", ["sport"]),
	D("🏓", "ping_pong", "Activity", ["table tennis", "sport"]),
	D("🏸", "badminton", "Activity", ["sport"]),
	D("🥋", "boxing_glove", "Activity", ["fight", "sport"]),
	D("🥊", "martial_arts_uniform", "Activity", ["karate", "sport"]),
	D("🎸", "guitar", "Activity", ["music", "instrument"]),
	D("🎹", "musical_keyboard", "Activity", ["piano", "music"]),
	D("🎼", "musical_score", "Activity", ["music", "sheet"]),
	D("🎵", "musical_note", "Activity", ["music", "tune"]),
	D("🎶", "musical_notes", "Activity", ["music", "tune"]),
	D("🎙️", "studio_microphone", "Activity", [
		"sing",
		"music",
		"record"
	]),
	D("🎤", "microphone", "Activity", ["sing", "karaoke"]),
	D("🎧", "headphone", "Activity", ["music", "listen"]),
	D("🥁", "drum", "Activity", ["music", "beat"]),
	D("📱", "iphone", "Activity", [
		"phone",
		"mobile",
		"apple"
	]),
	D("☎", "telephone", "Activity", ["phone", "call"]),
	D("📲", "mobile_phone", "Activity", ["cell", "smartphone"]),
	D("💻", "computer", "Activity", [
		"laptop",
		"code",
		"dev"
	]),
	D("⌨", "keyboard", "Activity", [
		"type",
		"input",
		"code"
	]),
	D("🖥", "desktop_computer", "Activity", ["pc", "monitor"]),
	D("🖨", "printer", "Activity", ["paper"]),
	D("📷", "camera", "Activity", ["photo", "picture"]),
	D("📸", "camera_flash", "Activity", ["photo"]),
	D("📹", "video_camera", "Activity", ["record", "film"]),
	D("📼", "vhs", "Activity", ["retro", "tape"]),
	D("🔋", "battery", "Activity", ["power", "charge"]),
	D("🔌", "electric_plug", "Activity", ["power"]),
	D("📚", "books", "Activity", ["library", "study"]),
	D("✍", "writing_hand", "Activity", ["write", "pen"]),
	D("📝", "memo", "Activity", ["write", "note"]),
	D("📈", "chart_with_upwards_trend", "Activity", [
		"graph",
		"growth",
		"stats"
	]),
	D("📉", "chart_with_downwards_trend", "Activity", [
		"graph",
		"loss",
		"stats"
	]),
	D("📊", "bar_chart", "Activity", ["graph", "stats"]),
	D("🎮", "video_game", "Activity", ["gaming", "controller"]),
	D("🕹️", "joystick", "Activity", ["gaming"]),
	D("🎲", "game_die", "Activity", [
		"dice",
		"random",
		"rpg"
	]),
	D("♟️", "chess_pawn", "Activity", ["board game", "strategy"]),
	D("🪄", "mahjong", "Activity", ["tiles", "game"]),
	D("🎭", "performing_arts", "Activity", ["theatre", "drama"]),
	D("🎪", "circus_tent", "Activity", ["carnival", "show"]),
	D("🎸️", "guitar", "Activity", ["music"]),
	D("🎹️", "musical_keyboard", "Activity", ["piano"]),
	D("🤷", "person_shrugging", "Activity", [
		"shrug",
		"dunno",
		" person"
	]),
	D("💃", "woman_dancing", "Activity", ["dance", "party"]),
	D("🕺", "man_dancing", "Activity", ["dance", "party"]),
	D("🏴󠁧󠁢󠁳󠁣󠁴󠁿", "black_flag", "Activity", ["gaming", "team"]),
	D("🏹", "triangular_flag_on_post", "Activity", ["milestone"]),
	D("🏆", "trophy", "Activity", ["win", "award"]),
	D("🥇", "1st_place_medal", "Activity", ["gold", "winner"]),
	D("🥈", "2nd_place_medal", "Activity", ["silver", "runner up"]),
	D("🥉", "3rd_place_medal", "Activity", ["bronze"]),
	D("⚽️", "soccer", "Activity", ["football"]),
	D("🏅", "sports_medal", "Activity", ["award", "winner"]),
	D("💦", "droplet", "Activity", ["water"]),
	D("🎯", "bullseye", "Activity", ["target", "goal"]),
	D("🪀", "yo_yo", "Activity", ["toy"])
], kt = [
	D("🚀", "rocket", "Travel", ["launch", "space"]),
	D("✈", "airplane", "Travel", ["flight", "travel"]),
	D("🚗", "automobile", "Travel", ["car", "drive"]),
	D("🚙", "sport_utility_vehicle", "Travel", ["car", "suv"]),
	D("🛻", "pickup_truck", "Travel", ["car", "truck"]),
	D("🚛", "bus", "Travel", ["transit"]),
	D("🚌", "bus_stop", "Travel", ["transit", "wait"]),
	D("🚕", "trolleybus", "Travel", ["transit"]),
	D("🚒", "fire_engine", "Travel", ["truck", "emergency"]),
	D("🚑", "ambulance", "Travel", ["emergency", "hospital"]),
	D("🚚", "police_car", "Travel", ["emergency", "cop"]),
	D("🚲", "bicycle", "Travel", ["bike", "cycle"]),
	D("🛴", "kick_scooter", "Travel", ["scooter"]),
	D("🛹", "motor_scooter", "Travel", ["moped", "scooter"]),
	D("🚌", "bus", "Travel", ["transit"]),
	D("🚃", "train", "Travel", ["rail", "subway"]),
	D("🚆", "train2", "Travel", ["rail"]),
	D("🚏", "tram", "Travel", ["light rail"]),
	D("🚇", "metro", "Travel", ["subway", "underground"]),
	D("🚄", "bullettrain_side", "Travel", ["high speed", "train"]),
	D("🚅", "bullettrain_front", "Travel", ["high speed", "train"]),
	D("🚉", "station", "Travel", ["train", "platform"]),
	D("🚂", "locomotive", "Travel", ["train"]),
	D("✍️", "ticket", "Travel", ["boarding"]),
	D("🎟️", "tickets", "Travel", ["boarding pass"]),
	D("🚢", "ship", "Travel", ["boat", "cruise"]),
	D("⛵", "sailboat", "Travel", ["boat", "yacht"]),
	D("🚤", "speedboat", "Travel", ["boat"]),
	D("🚣", "ferry", "Travel", ["boat"]),
	D("⛴", "anchor", "Travel", ["ship", "port"]),
	D("🗿", "moai", "Travel", ["easter island"]),
	D("🏕️", "camping", "Travel", ["nature"]),
	D("🏖️", "beach_with_umbrella", "Travel", ["holiday", "sea"]),
	D("🏜️", "desert", "Travel", ["sand", "arid"]),
	D("🏝️", "desert_island", "Travel", ["palms"]),
	D("🏞️", "national_park", "Travel", ["nature"]),
	D("🏟️", "stadium", "Travel", ["arena", "sport"]),
	D("🏛️", "classical_building", "Travel", ["museum", "architecture"]),
	D("🏗️", "building_construction", "Travel", ["crane", "wip"]),
	D("⛲", "fountain", "Travel", ["water", "city"]),
	D("⛺", "tent", "Travel", ["camping"]),
	D("🌁", "foggy", "Travel", ["weather", "mist"]),
	D("☀️", "sunny", "Travel", ["weather", "clear"]),
	D("⛅", "rain", "Travel", ["weather", "wet"]),
	D("❄️", "snowflake", "Travel", [
		"weather",
		"cold",
		"winter"
	]),
	D("⚡", "zap", "Travel", [
		"weather",
		"storm",
		"lightning"
	]),
	D("🌀", "cyclone", "Travel", ["weather", "spiral"]),
	D("🌧️", "rainbow", "Travel", ["weather", "pride"]),
	D("☁️", "cloud", "Travel", ["weather"]),
	D("⭐", "star", "Travel", ["night", "space"]),
	D("🌌", "milky_way", "Travel", ["space", "night"]),
	D("🏰󠁧󠁢󠁥󠁮󠁧󠁿", "rainbow_flag", "Travel", ["pride", "lgbtq"])
], At = [
	D("📷", "camera", "Objects", ["photo"]),
	D("🔨", "hammer", "Objects", ["tool", "build"]),
	D("🪓", "axe", "Objects", ["tool", "chop"]),
	D("🔧", "wrench", "Objects", ["tool", "fix"]),
	D("🛠️", "hammer_and_pick", "Objects", ["tools", "build"]),
	D("🛡️", "shield", "Objects", ["security", "protect"]),
	D("🪩", "carpentry_saw", "Objects", ["tool", "cut"]),
	D("🔧️", "wrench", "Objects", ["tool"]),
	D("⚙", "gear", "Objects", ["settings", "cog"]),
	D("🔒", "lock", "Objects", ["secure", "private"]),
	D("🔓", "unlock", "Objects", ["open", "access"]),
	D("🔑", "key", "Objects", [
		"lock",
		"access",
		"password"
	]),
	D("👝", "bulb", "Objects", ["idea", "light"]),
	D("💡", "bulb", "Objects", ["idea", "light"]),
	D("🔦", "flashlight", "Objects", ["torch", "light"]),
	D("📚", "books", "Objects", ["read", "library"]),
	D("📖", "open_book", "Objects", ["read", "study"]),
	D("📕", "closed_book", "Objects", ["read"]),
	D("📘", "blue_book", "Objects", ["read", "study"]),
	D("📗", "green_book", "Objects", ["read"]),
	D("📙", "notebook", "Objects", ["notes"]),
	D("📓", "notebook_with_decorative_cover", "Objects", ["notes"]),
	D("📰", "newspaper", "Objects", ["news", "press"]),
	D("📁", "file_folder", "Objects", ["folder", "files"]),
	D("📂", "open_file_folder", "Objects", ["folder"]),
	D("🗂️", "card_index_dividers", "Objects", ["organise"]),
	D("🗒️", "card_index", "Objects", ["organise"]),
	D("📄", "page_facing_up", "Objects", ["document"]),
	D("💰", "money_bag", "Objects", ["cash", "rich"]),
	D("💳", "credit_card", "Objects", ["pay", "money"]),
	D("💎", "gem", "Objects", [
		"diamond",
		"jewel",
		" rare"
	]),
	D("💫", "droplet", "Objects", ["water", "liquid"]),
	D("🧰", "toolbox", "Objects", ["tools", "repair"]),
	D("🧲", "magnet", "Objects", ["attract"]),
	D("🪜", "hook", "Objects", ["hanger"]),
	D("⚒", "scales", "Objects", ["balance", "justice"]),
	D("⛏", "pick", "Objects", ["tool", "mine"]),
	D("🔧️⚒", "toolbox", "Objects", ["tools"]),
	D("🧳", "broom", "Objects", ["clean", "sweep"]),
	D("🧺", "basket", "Objects", ["tidy"]),
	D("🧻", "roll_of_paper", "Objects", ["toilet", "clean"]),
	D("🚿", "shower", "Objects", ["bath", "wash"]),
	D("🛁", "bathtub", "Objects", ["bath", "wash"]),
	D("🛋️", "couch_and_lamp", "Objects", ["living room"]),
	D("🚽", "toilet", "Objects", ["bathroom"]),
	D("🧰", "toolbox", "Objects", ["repair"]),
	D("🪡", "window", "Objects", ["open", "view"]),
	D("🪑", "chair", "Objects", ["sit", "furniture"]),
	D("🪑", "chair", "Objects", ["furniture"]),
	D("🚽", "bed", "Objects", ["sleep", "rest"]),
	D("🛏️", "pillow", "Objects", ["sleep", "comfort"]),
	D("🛋️", "couch", "Objects", ["lounge"]),
	D("🖼️", "framed_picture", "Objects", ["art", "wall"]),
	D("🎸️", "guitar", "Objects", ["instrument"]),
	D("🥁", "drum", "Objects", ["instrument"]),
	D("🪗", "accordion", "Objects", ["instrument", "music"]),
	D("🪕", "banjo", "Objects", ["instrument"]),
	D("🎻️", "violin", "Objects", ["instrument", "music"]),
	D("🎼", "musical_score", "Objects", ["music"]),
	D("🎷", "saxophone", "Objects", ["instrument", "music"]),
	D("🎺", "trumpet", "Objects", ["instrument", "music"]),
	D("🎴", "musical_note", "Objects", ["music"]),
	D("🎶", "musical_notes", "Objects", ["music"]),
	D("🎸", "guitar", "Objects", ["music"]),
	D("🧸", "teddy_bear", "Objects", ["toy", "cute"]),
	D("🪅", "pinata", "Objects", ["party", "candy"]),
	D("🎮", "video_game", "Objects", ["gaming"]),
	D("🎲", "game_die", "Objects", ["dice", "random"]),
	D("🪀", "yo_yo", "Objects", ["toy"]),
	D("🎯", "bullseye", "Objects", ["target"]),
	D("🎱", "boxing_glove", "Objects", ["sport"]),
	D("🏏", "cricket_bat_and_ball", "Objects", ["sport"]),
	D("🏸", "badminton_racquet_and_shuttlecock", "Objects", ["sport"]),
	D("🥏", "lacrosse", "Objects", ["sport"]),
	D("🪊", "boxing_glove", "Objects", ["sport"]),
	D("🪃", "boomerang", "Objects", ["throw", "return"]),
	D("⛳", "flag_in_hole", "Objects", ["golf"]),
	D("🏌️", "golf", "Objects", ["sport"]),
	D("🏓", "ping_pong", "Objects", ["sport"]),
	D("🥌", "curling_stone", "Objects", ["sport"]),
	D("🏒", "ice_hockey_stick_and_puck", "Objects", ["sport"]),
	D("🥍", "lacrosse", "Objects", ["sport"]),
	D("🏑", "field_hockey_stick_and_ball", "Objects", ["sport"]),
	D("🏇", "horse_racing", "Objects", ["sport"]),
	D("🏉", "bowling", "Objects", ["sport"]),
	D("⚽", "soccer", "Objects", ["sport"]),
	D("🏆", "trophy", "Objects", ["win", "award"]),
	D("🏅", "sports_medal", "Objects", ["award"]),
	D("⚽️", "soccer", "Objects", ["sport"]),
	D("🧿", "nazar_amulet", "Objects", ["protection", "eye"]),
	D("🪠", "hamsa", "Objects", ["protection"]),
	D("🧼", "mirror", "Objects", ["reflect"]),
	D("🪓", "axe", "Objects", ["tool"])
], jt = [
	D("❤️", "heart", "Symbols", ["love"]),
	D("💔", "broken_heart", "Symbols", ["sad"]),
	D("💯", "hundred", "Symbols", ["100"]),
	D("🔢", "1234", "Symbols", ["numbers"]),
	D("✅", "white_check_mark", "Symbols", [
		"done",
		"yes",
		"tick"
	]),
	D("❌", "x", "Symbols", [
		"no",
		"wrong",
		"fail"
	]),
	D("❗", "exclamation", "Symbols", ["!", "important"]),
	D("❓", "question", "Symbols", ["?"]),
	D("‼️", "bangbang", "Symbols", ["!!"]),
	D("⁉️", "exclamation_question", "Symbols", ["!?"]),
	D("🆗", "ok", "Symbols", ["yes", "agree"]),
	D("🅱", "new", "Symbols", ["fresh", "badge"]),
	D("🔺", "arrow_up", "Symbols", ["direction"]),
	D("⬆️", "arrow_up", "Symbols", ["direction"]),
	D("⬇️", "arrow_down", "Symbols", ["direction"]),
	D("⬅️", "arrow_left", "Symbols", ["direction"]),
	D("➡️", "arrow_right", "Symbols", ["direction"]),
	D("🔃", "arrows_counterclockwise", "Symbols", ["sync", "refresh"]),
	D("🔄", "arrows_clockwise", "Symbols", ["sync", "load"]),
	D("🔙", "arrow_back", "Symbols", ["return", "previous"]),
	D("🔚", "arrow_right_hook", "Symbols", ["share"]),
	D("💢", "anger", "Symbols", ["mad"]),
	D("💥", "collision", "Symbols", ["boom", "explode"]),
	D("💫", "dizzy", "Symbols", ["star"]),
	D("💦", "droplet", "Symbols", ["water"]),
	D("💨", "dash", "Symbols", ["fast"]),
	D("🕳️", "hole", "Symbols", ["circle"]),
	D("💬", "speech_balloon", "Symbols", ["comment"]),
	D("🗨️", "left_speech_bubble", "Symbols", ["comment"]),
	D("🗯️", "right_anger_bubble", "Symbols", ["comment", "mad"]),
	D("💤", "zzz", "Symbols", ["sleep", "boring"]),
	D("💬️", "speech_balloon", "Symbols", ["comment"]),
	D("👁️", "eyes", "Symbols", ["look"]),
	D("👀", "eyes", "Symbols", ["look"]),
	D("⌛", "hourglass", "Symbols", ["time", "wait"]),
	D("⏳", "hourglass_flowing_sand", "Symbols", ["time", "wait"]),
	D("⏰", "alarm_clock", "Symbols", ["time", "alarm"]),
	D("⏱️", "stopwatch", "Symbols", ["time", "timer"]),
	D("⏲️", "timer", "Symbols", ["time"]),
	D("🕰️", "clock", "Symbols", ["time"]),
	D("🌑", "new_moon", "Symbols", ["night", "phase"]),
	D("🌒", "waxing_crescent_moon", "Symbols", ["night", "phase"]),
	D("🌓", "first_quarter_moon", "Symbols", ["night", "phase"]),
	D("🌔", "waxing_gibbous_moon", "Symbols", ["night", "phase"]),
	D("🌕", "full_moon", "Symbols", ["night", "phase"]),
	D("🌖", "waning_gibbous_moon", "Symbols", ["night", "phase"]),
	D("🌗", "last_quarter_moon", "Symbols", ["night", "phase"]),
	D("🌘", "waning_crescent_moon", "Symbols", ["night", "phase"]),
	D("🌙", "crescent_moon", "Symbols", ["night"]),
	D("🌚", "new_moon_face", "Symbols", ["night"]),
	D("⭐", "star", "Symbols", ["favourite"]),
	D("🌟", "star2", "Symbols", ["glow", "shine"]),
	D("🌠", "comet", "Symbols", ["space", "shooting star"]),
	D("🌌", "milky_way", "Symbols", ["space"]),
	D("🌟️", "star2", "Symbols", ["shine"]),
	D("🔯", "dotted_six_pointed_star", "Symbols", ["magic"]),
	D("💮", "white_flower", "Symbols", ["flower", "pure"]),
	D("🏵️", "rosette", "Symbols", ["flower"]),
	D("🌿", "herb", "Symbols", ["plant", "leaf"]),
	D("🍀", "four_leaf_clover", "Symbols", ["luck"]),
	D("🍁", "maple_leaf", "Symbols", ["autumn", "canada"]),
	D("🍂", "fallen_leaf", "Symbols", ["autumn"]),
	D("🍄", "mushroom", "Symbols", ["fungus", "nature"]),
	D("🍓", "strawberry", "Symbols", ["fruit"]),
	D("🌺", "hibiscus", "Symbols", ["flower"]),
	D("🌸", "cherry_blossom", "Symbols", ["flower", "sakura"]),
	D("💮", "flower", "Symbols", ["nature"]),
	D("🏳️", "white_flag", "Symbols", ["surrender"]),
	D("🏳", "white_flag", "Symbols", ["surrender"]),
	D("🏴️", "black_flag", "Symbols", ["dark"]),
	D("🏁", "chequered_flag", "Symbols", ["race", "finish"]),
	D("⚖", "scales", "Symbols", ["justice", "balance"]),
	D("⚛", "atom", "Symbols", ["science", "physics"]),
	D("🔬", "microscope", "Symbols", ["science", "research"]),
	D("🔭", "telescope", "Symbols", ["space", "stars"]),
	D("🧩", "brain", "Symbols", ["smart", "think"]),
	D("🧪", "test_tube", "Symbols", ["science", "lab"]),
	D("🧬", "dna", "Symbols", ["biology", "genetics"]),
	D("🔫", "thermometer", "Symbols", ["temperature"]),
	D("💡", "light_bulb", "Symbols", ["idea"]),
	D("🔍", "mag", "Symbols", ["search", "find"]),
	D("🔎", "mag_right", "Symbols", ["search", "find"]),
	D("🕯", "lamp", "Symbols", ["light"]),
	D("🎡", "carousel_horse", "Symbols", ["fair", "carousel"]),
	D("⚠️", "warning", "Symbols", ["caution", "alert"]),
	D("🚫", "prohibited", "Symbols", ["no", "ban"]),
	D("🚳", "no_bicycles", "Symbols", ["no", "ban"]),
	D("🚭", "no_smoking", "Symbols", ["no", "ban"]),
	D("🚯", "no_littering", "Symbols", ["no", "ban"]),
	D("🚱", "non_potable_water", "Symbols", ["no", "ban"]),
	D("🔗", "link", "Symbols", ["url", "chain"]),
	D("🔗️", "link", "Symbols", ["url"]),
	D("💡", "bulb", "Symbols", ["idea"]),
	D("🔦", "flashlight", "Symbols", ["light"]),
	D("🕮", "bookmark", "Symbols", ["save"]),
	D("📰", "newspaper", "Symbols", ["news"]),
	D("📌", "memo", "Symbols", ["note"]),
	D("📎", "paperclip", "Symbols", ["attach", "file"]),
	D("✂️", "scissors", "Symbols", ["cut"]),
	D("🗃️", "card_file_box", "Symbols", ["archive"]),
	D("🗑️", "wastebasket", "Symbols", ["trash", "delete"]),
	D("✔️", "check_mark", "Symbols", ["done"]),
	D("✖️", "x_mark", "Symbols", ["no"]),
	D("➤️", "arrow_right_hook", "Symbols", ["share"]),
	D("➜", "arrows_counterclockwise", "Symbols", ["refresh"]),
	D("🔻", "arrow_down_small", "Symbols", ["direction"]),
	D("🔃️", "arrows_counterclockwise", "Symbols", ["refresh"]),
	D("🔟", "keycap_ten", "Symbols", ["number"]),
	D("🔠", "input_latin_uppercase", "Symbols", ["input", "caps"]),
	D("🔡", "input_latin_lowercase", "Symbols", ["input"]),
	D("🔢", "input_numbers", "Symbols", ["input", "number"]),
	D("🔣", "input_symbols", "Symbols", ["input"]),
	D("🆎", "ab", "Symbols", ["blood", "type"]),
	D("🆑", "cl", "Symbols", ["clear", "type"]),
	D("🆒", "cool", "Symbols", ["type"]),
	D("🆓", "free", "Symbols", ["type"]),
	D("🆔", "id", "Symbols", ["type"]),
	D("🆕", "new2", "Symbols", ["type"]),
	D("🆖", "ng", "Symbols", ["type"]),
	D("🅾️", "o2", "Symbols", ["type"]),
	D("🅿️", "ok2", "Symbols", ["type"]),
	D("🈁", "sos", "Symbols", ["help", "emergency"]),
	D("🈂", "up!", "Symbols", ["up"]),
	D("🈷", "hourglass_flowing_sand", "Symbols", ["time"]),
	D("Ⓜ️", "m", "Symbols", ["airplane", "letter"]),
	D("🆚", "free2", "Symbols", ["type"]),
	D("🈁", "sos", "Symbols", ["emergency"]),
	D("🈚", "copyright", "Symbols", ["legal", "mark"]),
	D("🈯", "registered", "Symbols", ["legal", "mark"]),
	D("©️", "copyright", "Symbols", ["legal"]),
	D("®", "registered", "Symbols", ["legal"]),
	D("〽️", "part_alternation_mark", "Symbols", ["japan"]),
	D("〾️", "conjugation", "Symbols", ["japan"]),
	D("🉐", "bamboo", "Symbols", ["japan"])
], Mt = [
	D("🇦🇧", "flag_br", "Flags", ["brazil"]),
	D("🇩🇪", "flag_de", "Flags", ["germany"]),
	D("🇫🇷", "flag_fr", "Flags", ["france"]),
	D("🇮🇳", "flag_gb", "Flags", [
		"uk",
		"britain",
		"england"
	]),
	D("🇪🇺", "flag_es", "Flags", ["spain"]),
	D("🇬🇧", "flag_it", "Flags", ["italy"]),
	D("🇧🇷", "flag_jp", "Flags", ["japan"]),
	D("🇰🇷", "flag_kr", "Flags", ["korea", "south"]),
	D("🇸🇪", "flag_se", "Flags", ["sweden"]),
	D("🇪🇸", "flag_es2", "Flags", ["spain"]),
	D("🇨🇦", "flag_ca", "Flags", ["canada"]),
	D("🇦🇺", "flag_au", "Flags", ["australia"]),
	D("🇦🇺️", "flag_au", "Flags", ["australia"]),
	D("🇸🇮", "flag_in", "Flags", ["india"]),
	D("🇳🇱", "flag_nl", "Flags", ["netherlands", "holland"]),
	D("🇵🇭", "flag_pl", "Flags", ["poland"]),
	D("🇵🇱", "flag_pt", "Flags", ["portugal"]),
	D("🇹🇭", "flag_tr", "Flags", ["turkey"]),
	D("🇺🇸", "flag_us", "Flags", ["usa", "america"]),
	D("🇸🇺", "flag_us2", "Flags", ["usa"]),
	D("🇦🇷", "flag_ar", "Flags", ["argentina"]),
	D("🇧🇷", "flag_au2", "Flags", ["austria"]),
	D("🇧🇴", "flag_bh", "Flags", ["bahrain"]),
	D("🇧🇩", "flag_be", "Flags", ["belgium"]),
	D("🇴🇷", "flag_mx", "Flags", ["mexico"]),
	D("🇸🇧", "flag_ch", "Flags", ["switzerland"]),
	D("🇨🇯", "flag_cz", "Flags", ["czechia"]),
	D("🇰🇷", "flag_gr", "Flags", ["greece"]),
	D("🇮🇹", "flag_ie", "Flags", ["ireland"]),
	D("🇲🇽", "flag_mx2", "Flags", ["mexico"]),
	D("🇳🇴", "flag_nz", "Flags", ["new zealand"]),
	D("🇵🇹", "flag_ro", "Flags", ["romania"]),
	D("🇸🇦", "flag_sa", "Flags", ["saudi arabia"]),
	D("🇸🇦️", "flag_sa", "Flags", ["saudi arabia"]),
	D("🇪🇬", "flag_gb2", "Flags", ["britain"]),
	D("🇸🇪", "flag_co", "Flags", ["colombia"]),
	D("🇦🇹", "flag_be2", "Flags", ["belgium"]),
	D("🇺🇳", "flag_vn", "Flags", ["vietnam"]),
	D("🇦🇵", "flag_pk", "Flags", ["pakistan"]),
	D("🇦🇮", "flag_ng", "Flags", ["nigeria"]),
	D("🇷🇾", "flag_ru", "Flags", ["russia"]),
	D("🇩🇪", "flag_de2", "Flags", ["germany"]),
	D("🇨🇩", "flag_cf", "Flags", ["central african republic"]),
	D("🇨🇭", "flag_ca2", "Flags", ["canada"]),
	D("🇱🇷", "flag_cl", "Flags", ["chile"]),
	D("🇨🇱", "flag_bx", "Flags", ["belgium"]),
	D("🇷🇳", "flag_cn", "Flags", ["china"]),
	D("🇸🇸", "flag_ac", "Flags", ["ascension island"]),
	D("🇷🇴", "flag_cx", "Flags", ["christmas island"]),
	D("🇨🇭️", "flag_ca3", "Flags", ["canada"]),
	D("🇦🇩", "flag_cp", "Flags", ["clipperton island"]),
	D("🇨🇦", "flag_bq", "Flags", ["caribbean netherlands"]),
	D("🇧🇾", "flag_by", "Flags", ["belarus"]),
	D("🇨🇳", "flag_cv", "Flags", ["cape verde"]),
	D("🇨🇺", "flag_cu", "Flags", ["cuba"]),
	D("🇨🇯", "flag_ee", "Flags", ["estonia"]),
	D("🇬🇭", "flag_kz", "Flags", ["kazakhstan"]),
	D("🇲🇶", "flag_na", "Flags", ["namibia"]),
	D("🇮🇴", "flag_eu", "Flags", ["european union"]),
	D("🇰🇼", "flag_kr2", "Flags", ["south korea"]),
	D("🇯🇵", "flag_jp2", "Flags", ["japan"]),
	D("🇧🇷️", "flag_at", "Flags", ["austria"]),
	D("🇲🇰", "flag_cz2", "Flags", ["czechia"]),
	D("🇹🇷", "flag_tw", "Flags", ["taiwan"]),
	D("🇺🇲", "flag_gq", "Flags", ["equatorial guinea"]),
	D("🇸🇮", "flag_cm", "Flags", ["cameroon"]),
	D("🇬🇷", "flag_it2", "Flags", ["italy"])
], Nt = [
	...Ct,
	...wt,
	...Tt,
	...Et,
	...Dt,
	...Ot,
	...kt,
	...At,
	...jt,
	...Mt
], k = [
	"̀",
	"́",
	"̂",
	"̃",
	"̄",
	"̅",
	"̆",
	"̇",
	"̈",
	"̉",
	"̊",
	"̋",
	"̌",
	"̍",
	"̎",
	"̏",
	"̐",
	"̒",
	"̓",
	"̔",
	"͂",
	"̓",
	"̈́",
	"ͅ"
], A = [
	"̛",
	"̜",
	"̝",
	"̞",
	"̟",
	"̠",
	"̡",
	"̢",
	"̥",
	"̦",
	"̧",
	"̨",
	"̩",
	"̪",
	"̫",
	"̬",
	"̭",
	"̮",
	"̯",
	"̰",
	"̱",
	"̹",
	"̺",
	"̻",
	"̼"
], j = [
	"̣",
	"̤",
	"̧",
	"̨",
	"̩",
	"̪",
	"̫",
	"̬",
	"̭",
	"̮",
	"̯",
	"̰",
	"̱",
	"̲",
	"̳",
	"̴",
	"̵",
	"̶",
	"̷",
	"̸",
	"̻",
	"̼",
	"ͅ"
];
function Pt(e, t = "random", n = 1) {
	let r = () => {
		if (t === "up") return k[Math.floor(Math.random() * k.length)];
		if (t === "down") return j[Math.floor(Math.random() * j.length)];
		if (t === "middle") return A[Math.floor(Math.random() * A.length)];
		if (t === "all") {
			let e = [
				...k,
				...A,
				...j
			];
			return e[Math.floor(Math.random() * e.length)];
		}
		let e = [
			k,
			A,
			j
		], n = e[Math.floor(Math.random() * e.length)];
		return n[Math.floor(Math.random() * n.length)];
	}, i = Math.max(1, Math.min(8, n));
	return Array.from(e).map((e) => {
		if (!e.trim()) return e;
		let t = "";
		for (let e = 0; e < i; e++) t += r();
		return e + t;
	}).join("");
}
function M(e, t) {
	let n = /* @__PURE__ */ new Map();
	return Array.from(t).forEach((t, r) => {
		n.set(t, String.fromCodePoint(e + r));
	}), n;
}
var N = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", P = "abcdefghijklmnopqrstuvwxyz", F = "0123456789";
function Ft() {
	let e = new Map([
		...M(120276, N),
		...M(120302, P),
		...M(120812, F)
	]), t = new Map([...M(120328, N), ...M(120354, P)]), n = new Map([...M(120380, N), ...M(120406, P)]), r = new Map([...M(119964, N), ...M(119990, P)]), i = new Map([...M(120068, N), ...M(120094, P)]), a = new Map([...M(120068, N), ...M(120172, P)]), o = new Map([
		...M(120120, N),
		...M(120146, P),
		...M(120792, F)
	]), s = new Map([
		...M(120432, N),
		...M(120458, P),
		...M(120822, F)
	]), c = new Map([
		...M(9398, N),
		...M(9424, P),
		...M(9450, F)
	]), l = new Map([...M(127280, N), ...M(127312, P)]), u = new Map([
		...M(65313, N),
		...M(65345, P),
		...M(65296, F)
	]), d = e, f = new Map([
		...M(120224, N),
		...M(120250, P),
		...M(120802, F)
	]);
	return {
		bold: e,
		italic: t,
		boldItalic: n,
		script: r,
		fraktur: i,
		frakturSmall: a,
		doubleStruck: o,
		monospace: s,
		circled: c,
		squared: l,
		fullwidth: u,
		sansBold: d,
		sansPlain: f,
		sansItalicPlain: t,
		sansBoldItalicPlain: n,
		sansSerif: f
	};
}
var It = Ft(), Lt = [
	{
		id: "bold",
		label: "Bold"
	},
	{
		id: "italic",
		label: "Italic"
	},
	{
		id: "boldItalic",
		label: "Bold Italic"
	},
	{
		id: "script",
		label: "Script"
	},
	{
		id: "fraktur",
		label: "Fraktur"
	},
	{
		id: "frakturSmall",
		label: "Fraktur Small"
	},
	{
		id: "doubleStruck",
		label: "Double Struck"
	},
	{
		id: "monospace",
		label: "Monospace"
	},
	{
		id: "circled",
		label: "Circled"
	},
	{
		id: "squared",
		label: "Squared"
	},
	{
		id: "fullwidth",
		label: "Fullwidth"
	}
];
function Rt(e, t) {
	let n = It[t];
	if (!n) return e;
	let r = "";
	for (let i of e) r += n.get(i) ?? (t === "circled" && n.get(i), i);
	return r;
}
var zt = {
	a: "ᵃ",
	b: "ᵇ",
	c: "ᶜ",
	d: "ᵈ",
	e: "ᵉ",
	f: "ᶠ",
	g: "ᵍ",
	h: "ʰ",
	i: "ⁱ",
	j: "ʲ",
	k: "ᵏ",
	l: "ˡ",
	m: "ᵐ",
	n: "ⁿ",
	o: "ᵒ",
	p: "ᵖ",
	r: "ʳ",
	s: "ˢ",
	t: "ᵗ",
	u: "ᵘ",
	v: "ᵛ",
	w: "ʷ",
	x: "ˣ",
	y: "ʸ",
	z: "ᶻ",
	A: "ᴬ",
	B: "ᴮ",
	C: "ᴰ",
	D: "ᴱ",
	E: "ᴲ",
	F: "ᴳ",
	G: "ᴴ",
	H: "ᴵ",
	I: "ᴶ",
	J: "ᴷ",
	K: "ᴸ",
	L: "ᴹ",
	M: "ᴺ",
	N: "ᴻ",
	O: "ᴼ",
	P: "ᴽ",
	Q: "ᴾ",
	R: "ᴿ",
	S: "ᵀ",
	T: "ᵁ",
	U: "ᵂ",
	V: "ᵃ",
	W: "ᵄ",
	X: "ᵅ",
	Y: "ᵆ",
	0: "⁰",
	1: "¹",
	2: "²",
	3: "³",
	4: "⁴",
	5: "⁵",
	6: "⁶",
	7: "⁷",
	8: "⁸",
	9: "⁹",
	"+": "⁺",
	"-": "⁻",
	"=": "⁼",
	"(": "⁽",
	")": "⁾"
}, Bt = {
	a: "ₐ",
	b: "ᵦ",
	c: "ᶜ",
	d: "ᵧ",
	e: "ₑ",
	f: "ᵨ",
	g: "ₑ",
	h: "ᵩ",
	i: "ᵢ",
	j: "ⱼ",
	k: "ₖ",
	l: "ₗ",
	m: "ₘ",
	n: "ₙ",
	o: "ₒ",
	p: "ₚ",
	q: "ᵪ",
	r: "ᵫ",
	s: "ₛ",
	t: "ₜ",
	u: "ᵤ",
	v: "ᵥ",
	w: "ₘ",
	x: "ₓ",
	y: "ᵧ",
	z: "ᶵ",
	0: "₀",
	1: "₁",
	2: "₂",
	3: "₃",
	4: "₄",
	5: "₅",
	6: "₆",
	7: "₇",
	8: "₈",
	9: "₉",
	"+": "₊",
	"-": "₋",
	"=": "⁼",
	"(": "₍",
	")": "₎"
};
function Vt(e) {
	return Array.from(e).map((e) => zt[e] ?? (e.trim(), e)).join("");
}
function Ht(e) {
	return Array.from(e).map((e) => Bt[e] ?? e).join("");
}
var Ut = {
	a: "ɐ",
	b: "ƃ",
	c: "ɔ",
	d: "ƌ",
	e: "Ǝ",
	f: "ƒ",
	g: "ɢ",
	h: "ɵ",
	i: "İ",
	j: "ɼ",
	k: "ᴏ",
	l: "ᴩ",
	m: "ɯ",
	n: "ᴱ",
	o: "ᵇ",
	p: "ᴾ",
	q: "ʈ",
	r: "ᵣ",
	s: "ᵝ",
	t: "ᵭ",
	u: "ᵥ",
	v: "ᵯ",
	w: "ᵲ",
	x: "ᶊ",
	y: "ʏ",
	z: "ᶛ"
};
function Wt(e) {
	return Array.from(e).map((e) => Ut[e] ?? e.toUpperCase()).join("");
}
var Gt = {
	a: "̄",
	e: "́",
	i: "̂",
	o: "̀",
	u: "̆",
	n: "̃",
	c: "̧",
	s: "̬",
	z: "̌",
	y: "̈",
	A: "̄",
	E: "́",
	I: "̂",
	O: "̀",
	U: "̆"
};
function Kt(e) {
	return Array.from(e).map((e) => {
		let t = Gt[e];
		return t ? e + t : e;
	}).join("");
}
function qt(e) {
	return Array.from(e).map((e) => e.trim() ? `${e}\u0336` : e).join("");
}
function Jt(e) {
	return Array.from(e).map((e) => e.trim() ? `${e}\u0336` : e).join("");
}
function Yt(e) {
	return Array.from(e).join(" ");
}
function Xt(e) {
	return e.split("\n").map((e) => e.trim() ? `||${e}||` : e).join("\n");
}
function Zt(e) {
	return Array.from(e).map((e) => e.trim() ? `||${e}||` : e).join("");
}
var Qt = [
	{
		label: "Thin",
		value: "─".repeat(40)
	},
	{
		label: "Double",
		value: "═".repeat(30)
	},
	{
		label: "Heavy",
		value: "━".repeat(40)
	},
	{
		label: "Dotted",
		value: "· ".repeat(40)
	},
	{
		label: "Dashed",
		value: "┄ ".repeat(30)
	},
	{
		label: "Wave",
		value: "〰".repeat(30)
	},
	{
		label: "Equals",
		value: "═".repeat(20)
	},
	{
		label: "Single line, short",
		value: "─".repeat(20)
	},
	{
		label: "Solid block",
		value: "█".repeat(20)
	},
	{
		label: "Shade",
		value: "░".repeat(30)
	},
	{
		label: "Blocks",
		value: "█░▄▒▆".repeat(8)
	},
	{
		label: "Arrows",
		value: "⟶".repeat(20)
	},
	{
		label: "Hearts",
		value: "♥".repeat(20)
	},
	{
		label: "Stars",
		value: "★".repeat(20)
	},
	{
		label: "Diamond",
		value: "◆".repeat(20)
	},
	{
		label: "Slash",
		value: "╱".repeat(40)
	},
	{
		label: "Backslash",
		value: "╲".repeat(40)
	},
	{
		label: "Checkers",
		value: "▖▗".repeat(20)
	},
	{
		label: "Circles",
		value: "●○".repeat(20)
	},
	{
		label: "Corner",
		value: "╭".repeat(20)
	}
];
function $t(e, t) {
	return e.repeat(Math.max(1, t));
}
function en(e) {
	return e.replaceAll("||", "||||");
}
function tn(e) {
	let t = e.trim() ? e.trim().split(/\s+/).filter(Boolean) : [], n = e.trim();
	return {
		characters: Array.from(e).length,
		charactersNoSpaces: Array.from(e).filter((e) => !/\s/.test(e)).length,
		words: t.length,
		sentences: n ? n.split(/[.!?]+(?:\s|$)/).filter((e) => e.trim()).length : 0,
		paragraphs: n ? n.split(/\n\s*\n/).filter((e) => e.trim()).length : 0,
		lines: e ? e.split("\n").length : 0,
		uniqueWords: new Set(t.map((e) => e.toLowerCase())).size,
		readingSeconds: Math.round(t.length / 225),
		speakingSeconds: Math.round(t.length / 2.6)
	};
}
function nn(e) {
	return e.replace(/\w\S*/g, (e) => e[0].toUpperCase() + e.slice(1).toLowerCase());
}
function rn(e) {
	return Array.from(e).reverse().join("");
}
//#endregion
//#region src/lib/core/discord.ts
var an = "https://discord.com/api/v10", I = "https://cdn.discordapp.com";
function L(e) {
	let t = e.trim(), n = t.match(/discord\.gg\/([A-Za-z0-9-]+)/i);
	return n ? n[1] : t.replace(/^(https?:\/\/)?(www\.)?discord(app)?\.com\/invite\//i, "");
}
function on(e) {
	for (let t of [
		/discord\.com\/users\/(\d{17,20})/i,
		/discord\.com\/channels\/(\d{17,20})/i,
		/discord\.com\/guilds\/(\d{17,20})/i,
		/(?:^|\D)(\d{17,20})(?:\D|$)/
	]) {
		let n = e.match(t);
		if (n) return n[1];
	}
	return null;
}
var sn = [
	"16",
	"32",
	"64",
	"128",
	"256",
	"512",
	"1024",
	"2048",
	"4096"
];
function cn(e) {
	return e.startsWith("a_") ? "gif" : "png";
}
function ln(e, t, n = "1024") {
	return t ? `${I}/icons/${e}/${t}.${cn(t)}?size=${n}` : null;
}
function un(e, t, n = "1024") {
	return t ? `${I}/banners/${e}/${t}.${cn(t)}?size=${n}` : null;
}
function dn(e, t, n = "1024") {
	return t ? `${I}/splashes/${e}/${t}.png?size=${n}` : null;
}
//#endregion
//#region src/lib/core/embed.ts
var R = {
	title: 256,
	description: 4096,
	fields: 25,
	fieldName: 256,
	fieldValue: 1024,
	footer: 2048,
	author: 256,
	total: 6e3,
	embeds: 10
};
function z(e) {
	return (e ?? "").trim();
}
function fn(e) {
	let t = {}, n = e.embed ?? {}, r = [], i = [];
	z(n.title) && (t.title = n.title), z(n.url) && (t.url = n.url), z(n.description) && (t.description = n.description), z(n.timestamp) && (t.timestamp = n.timestamp), z(n.imageUrl) && (t.image = { url: n.imageUrl }), z(n.thumbnailUrl) && (t.thumbnail = { url: n.thumbnailUrl }), /^#[0-9a-f]{6}$/i.test(z(n.color)) ? t.color = parseInt(z(n.color).slice(1), 16) : z(n.color) && r.push("Colour is not a #rrggbb value, so it was left out of the payload."), (z(n.author?.name) || z(n.author?.iconUrl)) && (t.author = {
		...z(n.author?.name) ? { name: z(n.author?.name) } : {},
		...z(n.author?.url) ? { url: z(n.author?.url) } : {},
		...z(n.author?.iconUrl) ? { icon_url: z(n.author?.iconUrl) } : {}
	}), z(n.footer?.text) && (t.footer = {
		text: z(n.footer?.text),
		...z(n.footer?.iconUrl) ? { icon_url: z(n.footer?.iconUrl) } : {}
	});
	let a = (n.fields ?? []).filter((e) => z(e.name) || z(e.value));
	a.length && (t.fields = a.map((e) => ({
		name: e.name || "",
		value: e.value || "",
		inline: !!e.inline
	})));
	let o = {};
	(e.includeContent || z(e.content)) && (o.content = e.content ?? ""), z(e.username) && (o.username = z(e.username)), z(e.avatarUrl) && (o.avatar_url = z(e.avatarUrl)), z(e.threadId) && (o.thread_id = z(e.threadId)), Object.keys(t).length && (o.embeds = [t]);
	let s = Object.keys(o).length ? o : { embeds: [{}] }, c = JSON.stringify(s).length;
	z(n.title).length > R.title && r.push(`Title is over ${R.title} characters and will be rejected.`), z(n.description).length > R.description && r.push(`Description is over ${R.description} characters.`), c > R.total && r.push(`Total payload is over ${R.total} characters.`), a.length > R.fields && r.push(`Over ${R.fields} fields, which is the limit.`);
	for (let e of a) e.name.length > R.fieldName && r.push(`Field name "${e.name.slice(0, 20)}…" is over ${R.fieldName} characters.`), e.value.length > R.fieldValue && r.push(`Field value "${e.name.slice(0, 20)}…" is over ${R.fieldValue} characters.`);
	return z(n.footer?.text).length > R.footer && r.push(`Footer is over ${R.footer} characters.`), z(n.author?.name).length > R.author && r.push(`Author name is over ${R.author} characters.`), {
		payload: s,
		warnings: r,
		errors: i,
		characterCount: c
	};
}
function pn(e) {
	let t = fn(e);
	return {
		...t,
		limits: R,
		valid: t.warnings.length === 0 && t.errors.length === 0
	};
}
//#endregion
//#region src/lib/core/json.ts
function mn(e) {
	return new TextEncoder().encode(e).length;
}
function hn(e) {
	return Array.isArray(e) ? e.map(hn) : e && typeof e == "object" ? Object.fromEntries(Object.entries(e).sort(([e], [t]) => e.localeCompare(t)).map(([e, t]) => [e, hn(t)])) : e;
}
function gn(e) {
	let t = mn(e);
	try {
		return {
			data: JSON.parse(e),
			error: null,
			context: null,
			size: t
		};
	} catch (n) {
		let r = n instanceof Error ? n.message : "Invalid JSON", i = /position (\d+)/.exec(r)?.[1], a = i ? Number(i) : null;
		return {
			data: null,
			error: r,
			context: a !== null && e ? e.slice(Math.max(0, a - 30), a + 30) : null,
			size: t
		};
	}
}
function _n(e) {
	let t = {
		keys: 0,
		depth: 0,
		arrays: 0,
		objects: 0,
		strings: 0,
		numbers: 0,
		booleans: 0,
		nulls: 0
	}, n = (e, r) => {
		if (t.depth = Math.max(t.depth, r), Array.isArray(e)) {
			t.arrays += 1, e.forEach((e) => n(e, r + 1));
			return;
		}
		if (e && typeof e == "object") {
			t.objects += 1;
			for (let [i, a] of Object.entries(e)) t.keys += 1, n(a, r + 1);
			return;
		}
		e === null ? t.nulls += 1 : typeof e == "number" ? t.numbers += 1 : typeof e == "boolean" ? t.booleans += 1 : t.strings += 1;
	};
	return n(e, 0), t;
}
function vn(e, t, n = {}) {
	let { indent: r = 2, sortKeys: i = !1 } = n;
	if (t === "escape") return {
		output: JSON.stringify(e).slice(1, -1),
		error: null
	};
	if (t === "unescape") try {
		return {
			output: JSON.parse(`"${e}"`),
			error: null
		};
	} catch (e) {
		return {
			output: "",
			error: e instanceof Error ? e.message : "Could not unescape that string."
		};
	}
	let a = gn(e);
	if (a.error) return {
		output: "",
		error: a.error
	};
	let o = i ? hn(a.data) : a.data;
	return t === "validate" ? {
		output: "Valid JSON.",
		error: null
	} : t === "minify" ? {
		output: JSON.stringify(o),
		error: null
	} : {
		output: JSON.stringify(o, null, Math.max(0, Math.min(10, r))),
		error: null
	};
}
//#endregion
//#region src/lib/core/mentions.ts
function yn(e, t) {
	let n = h.find((t) => t.id === e) ?? h[0], r = t.split(/[\s,]+/).map((e) => e.trim()).filter(Boolean).map((t) => {
		if (e === "everyone" || e === "here" || e === "slash") return `${n.template.split("_")[0]}${t || ""}`;
		let r = /^\d{17,20}$/.test(t) ? t : "";
		return n.template.replace(/_?[A-Z_]+_?/g, r);
	}).filter(Boolean);
	return {
		type: n.id,
		template: n.template,
		note: n.note,
		mentions: r,
		output: r.join("\n")
	};
}
function bn() {
	return h.map((e) => ({
		id: e.id,
		label: e.label,
		template: e.template,
		note: e.note
	}));
}
//#endregion
//#region src/lib/core/permissions.ts
function xn() {
	return m.map(({ bit: e, ...t }) => ({
		...t,
		bit: e.toString()
	}));
}
var Sn = class extends Error {};
function Cn(e) {
	return e.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function wn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let e of m) {
		t.set(Cn(e.name), e.bit);
		let n = e.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
		t.set(n, e.bit);
	}
	return e.reduce((e, n) => {
		let r = t.get(Cn(n));
		if (r === void 0) throw new Sn(`"${n}" is not a Discord permission name. Use the name from /api/v1/permissions/all, such as "Send Messages" or "send_messages".`);
		return e | r;
	}, 0n);
}
function Tn(e) {
	return m.filter((t) => (e & t.bit) === t.bit).map((e) => e.name);
}
function En(e) {
	let t = e & ~m.reduce((e, t) => e | t.bit, 0n);
	return t === 0n ? [] : Array.from({ length: 53 }, (e, t) => t).filter((e) => (t & 1n << BigInt(e)) != 0n);
}
function Dn(e) {
	return En(e).map((e) => `bit ${e}`);
}
function On(e) {
	let t = String(e).trim();
	if (!t) throw new Sn("Enter a permission integer first.");
	try {
		if (/^-?0x[0-9a-f]+$/i.test(t) || /^-?0b[01]+$/i.test(t) || /^-?\d+$/.test(t)) return BigInt(t);
	} catch {}
	throw new Sn("A permission integer is decimal, 0x hex or 0b binary. Nothing else.");
}
function kn(e) {
	let t = Tn(e), n = {};
	for (let e of de) {
		let r = m.filter((n) => n.category === e && t.includes(n.name)).map((e) => e.name);
		r.length > 0 && (n[e] = r);
	}
	return {
		names: t,
		integer: pe(e),
		hex: fe(e),
		binary: me(e),
		count: t.length,
		administrator: t.includes("Administrator"),
		unknownBits: Dn(e),
		categories: n
	};
}
//#endregion
//#region src/lib/core/invites.ts
var An = [
	/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})/,
	/@me\/(\d{17,20})\/(\d{17,20})/,
	/channels\/(\d{17,20})\/(\d{17,20})/
];
function jn(e) {
	let t = e.trim();
	if (!t) return null;
	let n = /\/channels\/(\d{17,20})\/(\d{17,20})\/(\d{17,20})/.exec(t);
	if (n) return {
		guildId: n[1],
		channelId: n[2],
		messageId: n[3]
	};
	let r = /\/channels\/(\d{17,20})\/(\d{17,20})/.exec(t);
	if (r) return {
		guildId: "",
		channelId: r[1],
		messageId: r[2]
	};
	for (let e of An) {
		let n = e.exec(t);
		if (n) return {
			guildId: n[1] ?? "",
			channelId: n[2] ?? "",
			messageId: n[3] ?? ""
		};
	}
	return null;
}
var Mn = {
	1: "stream",
	2: "embedded-application"
};
function Nn(e) {
	let t = [], n = [], r = {};
	/^\d{17,20}$/.test(e.channelId) ? r.channel_id = e.channelId : t.push("Channel ID must be a 17-20 digit snowflake."), e.guildId && (/^\d{17,20}$/.test(e.guildId) ? r.guild_id = e.guildId : t.push("Guild ID must be a 17-20 digit snowflake."));
	let i = e.maxAge ?? 86400;
	!Number.isInteger(i) || i < 0 || i > 604800 ? t.push("max_age is in seconds and must be between 0 and 604800 (7 days).") : r.max_age = i;
	let a = e.maxUses ?? 0;
	return !Number.isInteger(a) || a < 0 || a > 1e3 ? t.push("max_uses must be between 0 (unlimited) and 1000.") : r.max_uses = a, e.unique && (r.unique = 1), e.temporary && (r.temporary = 1), e.targetType !== void 0 && (Mn[e.targetType] ? /^\d{17,20}$/.test(e.targetId ?? "") ? (r.target_type = e.targetType, r.target_application_id = e.targetId) : t.push("A target application or stream ID is required when target_type is set.") : t.push(`target_type must be 1 (${Mn[1]}) or 2 (${Mn[2]}).`)), i === 0 && n.push("max_age 0 means the invite never expires."), i > 604800 && n.push("Discord will clamp anything above 7 days."), {
		valid: t.length === 0,
		errors: t,
		warnings: n,
		query: r
	};
}
//#endregion
//#region src/lib/core/token.ts
function Pn(e) {
	let t = e.trim().split(".");
	if (t.length !== 3) return {
		userId: "",
		issuedAt: null,
		issuedAtIso: null,
		segments: t,
		valid: !1,
		error: `A token has 3 dot-separated segments. This one has ${t.length}.`
	};
	let n = "", i = null, a;
	try {
		n = r(t[0]).trim(), /^\d{17,20}$/.test(n) || (a = "First segment did not decode to a numeric user ID.");
	} catch {
		a = "First segment is not valid Base64url.";
	}
	try {
		let e = r(t[1]).trim(), n = Number(e);
		Number.isFinite(n) && n > 0 ? i = new Date(n) : a ??= "Second segment is not a readable timestamp.";
	} catch {
		a ??= "Second segment is not valid Base64url.";
	}
	return {
		userId: n,
		issuedAt: i,
		issuedAtIso: i ? i.toISOString() : null,
		segments: t,
		valid: !a,
		...a ? { error: a } : {}
	};
}
function Fn(e) {
	return e.trim().split(".").map((e, t) => t === 2 ? "•".repeat(Math.min(40, e.length)) : e).join(".");
}
//#endregion
//#region src/lib/core/vtt.ts
var In = /(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3})/;
function Ln(e) {
	let t = [];
	for (let n of e.replace(/\r/g, "").split(/\n{2,}/)) {
		let e = n.split("\n").filter((e) => e.trim().length > 0);
		if (e.length === 0) continue;
		let r = 0;
		/^\d+$/.test(e[0].trim()) && (r = 1);
		let i = e[r]?.match(In);
		i && t.push({
			index: t.length + 1,
			start: gt(i[1]),
			end: gt(i[2]),
			text: e.slice(r + 1).join(" ").replace(/<[^>]+>/g, "")
		});
	}
	return t;
}
function Rn(e) {
	let t = Math.max(0, e), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = Math.floor(t % 60), a = Math.round((t - Math.floor(t)) * 1e3);
	return `${n}:${String(r).padStart(2, "0")}:${String(i).padStart(2, "0")}.${String(a).padStart(3, "0")}`;
}
function zn(e, t = 10) {
	let n = Ln(e), r = n.reduce((e, t) => Math.max(e, t.end), 0);
	return {
		cueCount: n.length,
		duration: Math.round(r * 1e3) / 1e3,
		cues: n,
		discord: n.length === 0 ? null : {
			flags: 1,
			cues: n.slice(0, t).map((e) => ({
				start: Rn(e.start),
				duration: Rn(e.end - e.start),
				text: e.text.slice(0, 80)
			}))
		}
	};
}
//#endregion
//#region src/lib/core/config.ts
function Bn(e) {
	let t = e.trim().replace(/\/+$/, "");
	return t ? /^https?:\/\//i.test(t) ? t : `https://${t}` : "";
}
var Vn = {
	service_name: "aki's Discord Tools",
	short_service_name: "aki's distools",
	service_deploy_domain: "distools.itzdanti.dev",
	service_repo_link: "https://github.com/itzdanti/distools",
	service_docs_link: "https://distools.itzdanti.dev/docs",
	service_support: "distools@itzdanti.dev",
	license: "aki's Discord Tools License",
	privacy_policy: "https://distools.itzdanti.dev/privacy",
	terms_of_service: "https://distools.itzdanti.dev/terms",
	takedown_email: "legal@itzdanti.dev"
}, Hn = Vn.service_deploy_domain ? Bn(Vn.service_deploy_domain) : "", B = "/api/v1", Un = Hn || "https://distools.itzdanti.dev", V = class extends Error {
	status;
	details;
	constructor(e, t, n) {
		super(t), this.name = "ApiError", this.status = e, this.details = n;
	}
};
function H(e, t, n = "") {
	let r = e.body[t] ?? e.query.get(t);
	if (Array.isArray(r)) return r.length > 0 ? String(r[r.length - 1]) : n;
	let i = r == null ? "" : String(r);
	return i.trim() === "" ? n : i;
}
function U(e, t, n) {
	let r = H(e, t, "");
	if (r === "") return n;
	let i = Number(r);
	if (!Number.isFinite(i)) throw new V(400, `"${t}" must be a number.`);
	return i;
}
function W(e, t, n, r, i) {
	let a = U(e, t, n);
	if (!Number.isInteger(a)) throw new V(400, `"${t}" must be a whole number.`);
	if (a < r || a > i) throw new V(400, `"${t}" must be between ${r} and ${i}.`);
	return a;
}
function G(e, t, n = !1) {
	let r = H(e, t, "").toLowerCase();
	return r === "" ? n : r === "1" || r === "true" || r === "yes" || r === "on";
}
function Wn(e, t) {
	let n = e.body[t];
	return Array.isArray(n) ? n.map((e) => String(e).trim()).filter(Boolean) : typeof n == "string" && n.trim() !== "" ? n.split(",").map((e) => e.trim()).filter(Boolean) : e.query.getAll(t).flatMap((e) => e.split(",")).map((e) => e.trim()).filter(Boolean);
}
function K(e, t) {
	let n = H(e, t, "");
	if (n === "") throw new V(400, `"${t}" is required.`);
	return n;
}
function q(e, t, n) {
	if (!t.includes(e)) throw new V(400, `"${n}" must be one of: ${t.join(", ")}.`);
	return e;
}
function J(e) {
	if (!e.discord) throw new V(503, "This deployment has no Discord gateway configured.");
	return e.discord;
}
var Gn = Lt.map((e) => e.id), Kn = [
	"up",
	"down",
	"middle",
	"random",
	"all"
], qn = [
	"pretty",
	"minify",
	"validate",
	"escape",
	"unescape"
], Jn = [
	"encode",
	"decode",
	"encodeUrl",
	"decodeUrl"
], Yn = [
	"encode",
	"decode",
	"component"
], Xn = [
	"upper",
	"lower",
	"title",
	"reverse",
	"spaced",
	"accent",
	"outline",
	"strikethrough",
	"superscript",
	"subscript",
	"escapeSpoiler"
], Y = (e, t, n = {}) => ({
	name: e,
	in: "body",
	type: "string",
	description: t,
	...n
}), X = [
	{
		id: "text.fancy",
		method: "POST",
		path: `${B}/text/fancy`,
		group: "Text",
		summary: "Convert text to a fancy Unicode style",
		description: "Applies one of the site's font tables. Returns the same output as the Fancy Text tool.",
		tools: ["fancy-text"],
		params: [Y("text", "Text to convert.", {
			required: !0,
			example: "hello"
		}), Y("style", "Style id from GET /text/styles.", {
			default: "bold",
			enum: [...Gn],
			example: "bold"
		})],
		handler: (e) => ({
			style: q(H(e, "style", "bold"), Gn, "style"),
			output: Rt(K(e, "text"), q(H(e, "style", "bold"), Gn, "style"))
		})
	},
	{
		id: "text.styles",
		method: "GET",
		path: `${B}/text/styles`,
		group: "Text",
		summary: "List every fancy text style",
		description: "Style ids accepted by POST /text/fancy.",
		tools: ["fancy-text"],
		params: [],
		handler: () => Lt
	},
	{
		id: "text.zalgo",
		method: "POST",
		path: `${B}/text/zalgo`,
		group: "Text",
		summary: "Add combining characters (zalgo)",
		description: "Same modes as the Zalgo tool.",
		tools: ["zalgo-text"],
		params: [
			Y("text", "Text to stack.", {
				required: !0,
				example: "aki"
			}),
			Y("mode", "Direction of the marks.", {
				default: "random",
				enum: [...Kn]
			}),
			Y("amount", "Marks per character.", {
				type: "number",
				default: 1,
				example: "3"
			})
		],
		handler: (e) => {
			let t = q(H(e, "mode", "random"), Kn, "mode"), n = W(e, "amount", 1, 1, 20);
			return {
				mode: t,
				amount: n,
				output: Pt(K(e, "text"), t, n)
			};
		}
	},
	{
		id: "text.small-caps",
		method: "POST",
		path: `${B}/text/small-caps`,
		group: "Text",
		summary: "Convert text to small caps",
		description: "Unicode small capitals, not CSS.",
		tools: ["small-caps"],
		params: [Y("text", "Text to convert.", {
			required: !0,
			example: "aki"
		})],
		handler: (e) => ({ output: Wt(K(e, "text")) })
	},
	{
		id: "text.spoiler",
		method: "POST",
		path: `${B}/text/spoiler`,
		group: "Text",
		summary: "Wrap text in Discord spoilers",
		description: "Either one spoiler per line or one per character.",
		tools: ["spoiler-text"],
		params: [Y("text", "Text to hide.", {
			required: !0,
			example: "secret"
		}), Y("mode", "line or char.", {
			default: "line",
			enum: ["line", "char"]
		})],
		handler: (e) => {
			let t = q(H(e, "mode", "line"), ["line", "char"], "mode"), n = K(e, "text");
			return {
				mode: t,
				output: t === "line" ? Xt(n) : Zt(n)
			};
		}
	},
	{
		id: "text.divider",
		method: "POST",
		path: `${B}/text/divider`,
		group: "Text",
		summary: "Build a text divider",
		description: "Same characters as the Divider tool.",
		tools: ["text-divider"],
		params: [Y("char", "Character to repeat. Defaults to the first preset.", { example: "─" }), Y("length", "How many characters.", {
			type: "number",
			default: 40,
			example: "60"
		})],
		handler: (e) => {
			let t = H(e, "char", Qt[0].value), n = W(e, "length", 40, 1, 500);
			return {
				char: t,
				length: n,
				output: $t(t, n),
				presets: Qt
			};
		}
	},
	{
		id: "text.status",
		method: "POST",
		path: `${B}/text/status`,
		group: "Text",
		summary: "Build a Discord custom status",
		description: "Custom status needs Nitro. Presence (online, idle, do not disturb) is free and is set from the status picker, not a text field. Returns the emoji and preset lists so a client does not have to hardcode them.",
		tools: ["custom-status"],
		params: [Y("text", "Status text, up to 128 characters.", { example: "focus mode" }), Y("emoji", "Optional leading emoji. Only added when it is missing.", {
			enum: Je,
			example: "💻"
		})],
		handler: (e) => {
			let t = H(e, "text", ""), n = H(e, "emoji", ""), r = n !== "" && !t.startsWith(n) ? `${n} ${t}` : t;
			if (r.length > 128) throw new V(400, `That status is ${r.length} characters. Discord allows 128, including the emoji.`);
			return {
				status: r,
				length: r.length,
				limit: 128,
				requiresNitro: !0,
				emoji: Je,
				presets: qe
			};
		}
	},
	{
		id: "text.mentions",
		method: "POST",
		path: `${B}/text/mentions`,
		group: "Text",
		summary: "Build mention strings",
		description: "One id per line, or separated by spaces or commas.",
		tools: ["mentions"],
		params: [Y("type", "Mention type id.", {
			default: "user",
			enum: h.map((e) => e.id)
		}), Y("ids", "IDs to wrap.", {
			required: !0,
			example: "81384788765712384"
		})],
		handler: (e) => yn(H(e, "type", "user"), K(e, "ids"))
	},
	{
		id: "text.mention-types",
		method: "GET",
		path: `${B}/text/mention-types`,
		group: "Text",
		summary: "List mention templates",
		description: "Templates and notes for every mention type.",
		tools: ["mentions"],
		params: [],
		handler: () => bn()
	},
	{
		id: "text.stats",
		method: "POST",
		path: `${B}/text/stats`,
		group: "Text",
		summary: "Word, character and reading stats",
		description: "Identical to the Word Counter tool.",
		tools: ["word-counter"],
		params: [Y("text", "Text to measure.", { required: !0 })],
		handler: (e) => tn(K(e, "text"))
	},
	{
		id: "text.transform",
		method: "POST",
		path: `${B}/text/transform`,
		group: "Text",
		summary: "Case changes and stylisers",
		description: "Covers every mode of the Text Transform tool.",
		tools: ["text-transform"],
		params: [Y("text", "Text to transform.", { required: !0 }), Y("mode", "Transform to apply.", {
			required: !0,
			enum: [...Xn],
			example: "title"
		})],
		handler: (e) => {
			let t = q(K(e, "mode"), Xn, "mode"), n = K(e, "text");
			return {
				mode: t,
				output: t === "upper" ? n.toUpperCase() : t === "lower" ? n.toLowerCase() : t === "title" ? nn(n) : t === "reverse" ? rn(n) : t === "spaced" ? Yt(n) : t === "accent" ? Kt(n) : t === "outline" ? qt(n) : t === "strikethrough" ? Jt(n) : t === "superscript" ? Vt(n) : t === "subscript" ? Ht(n) : en(n)
			};
		}
	},
	{
		id: "ids.snowflake",
		method: "GET",
		path: `${B}/snowflake`,
		group: "IDs",
		summary: "Decode a snowflake",
		description: "Timestamp, worker, process and increment from any 17-20 digit ID.",
		tools: ["snowflake"],
		params: [{
			name: "id",
			in: "query",
			type: "string",
			required: !0,
			description: "The snowflake to decode.",
			example: "81384788765712384"
		}],
		handler: (e) => {
			let t = lt(K(e, "id"));
			return {
				id: t.id,
				timestamp: t.timestamp,
				iso: t.date.toISOString(),
				local: t.date.toString(),
				discord: `<t:${Math.floor(t.timestamp / 1e3)}:F>`,
				workerId: t.workerId,
				processId: t.processId,
				increment: t.increment,
				age: dt(t.date)
			};
		}
	},
	{
		id: "ids.snowflake-create",
		method: "POST",
		path: `${B}/snowflake/create`,
		group: "IDs",
		summary: "Build a snowflake from a date",
		description: "The inverse of the decode endpoint, using Discord's 2015 epoch.",
		tools: ["snowflake"],
		params: [
			Y("date", "ISO date or timestamp.", {
				required: !0,
				example: "2024-01-01T00:00:00Z"
			}),
			Y("worker_id", "Worker id, 0-31.", {
				type: "number",
				default: 1
			}),
			Y("process_id", "Process id, 0-31.", {
				type: "number",
				default: 0
			}),
			Y("increment", "Increment, 0-1023.", {
				type: "number",
				default: 0
			})
		],
		handler: (e) => {
			let t = T(K(e, "date"));
			return {
				id: ut(t, W(e, "worker_id", 1, 0, 31), W(e, "process_id", 0, 0, 31), W(e, "increment", 0, 0, 1023)),
				epoch: C,
				iso: t.toISOString()
			};
		}
	},
	{
		id: "ids.mock",
		method: "POST",
		path: `${B}/ids/mock`,
		group: "IDs",
		summary: "Generate fake snowflakes",
		description: "Real snowflake-shaped ids for seeding a dev database or testing mention rendering. They decode to a real timestamp, so nobody can tell them apart from a real id by shape alone.",
		tools: ["mock-ids"],
		params: [Y("count", "How many to generate.", {
			type: "number",
			default: 5,
			example: "10"
		}), Y("kind", "What the ids are for. Only changes the wording, never the format.", {
			default: "user",
			enum: [
				"user",
				"message",
				"role"
			]
		})],
		handler: (e) => {
			let t = W(e, "count", 5, 1, 50), n = q(H(e, "kind", "user"), [
				"user",
				"message",
				"role"
			], "kind"), r = Array.from({ length: t }, () => ut(new Date(Date.now() + Math.random() * 864e5)));
			return {
				kind: n,
				ids: r,
				mentions: r.map((e) => `<@${e}>`),
				note: "These are valid snowflakes but no account exists behind them."
			};
		}
	},
	{
		id: "ids.user",
		method: "GET",
		path: `${B}/discord/users/:id`,
		group: "Discord",
		summary: "Look up a user",
		description: "Unauthenticated Discord call, relayed so browsers are not blocked by CORS. Discord answers 401 both for a user that does not exist and for one it will not serve without a token, and it does not distinguish the two, so treat a 401 as \"no public profile for this ID\" rather than as proof either way.",
		tools: [
			"profile-viewer",
			"account-age",
			"pfp-grabber",
			"banner-grabber",
			"badge-checker"
		],
		params: [{
			name: "id",
			in: "path",
			type: "string",
			required: !0,
			description: "User ID, or any string containing one.",
			example: "81384788765712384"
		}],
		handler: async (e) => {
			let t = on(e.path.id ?? "") ?? e.path.id;
			return { user: await J(e).get(`/users/${t}`) };
		}
	},
	{
		id: "ids.guild",
		method: "GET",
		path: `${B}/discord/guilds/:id`,
		group: "Discord",
		summary: "Look up a server",
		description: "Accepts a server ID or a bare invite code. Discord answers 401 on the bare guild route without a bot token, so a code is the reliable option and returns the same guild object. A path segment cannot contain slashes, so strip a discord.gg link down to its code first, or use GET /invites/{code} directly.",
		tools: ["server-lookup"],
		params: [{
			name: "id",
			in: "path",
			type: "string",
			required: !0,
			description: "Guild ID, invite code or discord.gg link.",
			example: "197038439483310086"
		}],
		handler: async (e) => {
			let t = e.path.id ?? "", n = J(e);
			if (!on(t) || /discord\.gg/i.test(t)) {
				let e = L(t);
				if (e) return {
					via: "invite",
					guild: (await n.get(`/invites/${e}?with_counts=true&with_expiration=true`)).guild ?? null
				};
			}
			let r = on(t) ?? t;
			try {
				return {
					via: "guild",
					guild: await n.get(`/guilds/${r}?with_counts=true`)
				};
			} catch (e) {
				throw e instanceof V && (e.status === 401 || e.status === 403) ? new V(401, `Discord will not return server ${r} without a bot token. Pass an invite code or discord.gg link instead, which resolves the same server without authentication.`) : e;
			}
		}
	},
	{
		id: "ids.invite",
		method: "GET",
		path: `${B}/discord/invites/:code`,
		group: "Discord",
		summary: "Look up an invite",
		description: "Counts and expiry included. Unauthenticated.",
		tools: ["invite-info"],
		params: [{
			name: "code",
			in: "path",
			type: "string",
			required: !0,
			description: "Invite code or full discord.gg link.",
			example: "discord"
		}],
		handler: async (e) => {
			let t = L(e.path.code ?? "");
			return { invite: await J(e).get(`/invites/${encodeURIComponent(t)}?with_counts=true&with_expiration=true`) };
		}
	},
	{
		id: "ids.emoji",
		method: "GET",
		path: `${B}/discord/emojis/:id`,
		group: "Discord",
		summary: "Look up an emoji",
		description: "Returns the CDN URL for every size Discord holds.",
		tools: ["emoji-downloader"],
		params: [{
			name: "id",
			in: "path",
			type: "string",
			required: !0,
			description: "Emoji ID.",
			example: "1234567890123456789"
		}],
		handler: async (e) => ({ emoji: await J(e).get(`/emojis/${e.path.id}`) })
	},
	{
		id: "ids.snowflake-exists",
		method: "GET",
		path: `${B}/discord/snowflakes/:id`,
		group: "Discord",
		summary: "Check whether a snowflake is a real user",
		description: "A 404 means the ID does not belong to a user. Useful for verifying an ID someone sent you.",
		tools: ["snowflake", "id-finder"],
		params: [{
			name: "id",
			in: "path",
			type: "string",
			required: !0,
			description: "Snowflake to check.",
			example: "81384788765712384"
		}],
		handler: async (e) => {
			let t = lt(e.path.id);
			try {
				let n = await J(e).get(`/users/${e.path.id}`);
				return {
					id: e.path.id,
					exists: !0,
					username: n.username ?? null,
					createdIso: t.date.toISOString()
				};
			} catch (n) {
				if ((n instanceof V ? n.status : 0) === 404) return {
					id: e.path.id,
					exists: !1,
					username: null,
					createdIso: t.date.toISOString()
				};
				throw n;
			}
		}
	},
	{
		id: "invites.extract",
		method: "GET",
		path: `${B}/invites/extract`,
		group: "Invites",
		summary: "Pull the code out of an invite link",
		description: "Pure string handling, no Discord call.",
		tools: ["invite-builder", "invite-info"],
		params: [{
			name: "url",
			in: "query",
			type: "string",
			required: !0,
			description: "Any invite link or bare code.",
			example: "https://discord.gg/aki"
		}],
		handler: (e) => {
			let t = K(e, "url");
			return {
				code: L(t),
				url: `https://discord.gg/${L(t)}`
			};
		}
	},
	{
		id: "invites.images",
		method: "GET",
		path: `${B}/invites/images`,
		group: "Invites",
		summary: "Resolve a server icon and banner from an invite",
		description: "Returns CDN URLs rather than the image bytes, so nothing is proxied through here. Invite splash images are only shown to members who have passed the guild boost requirements.",
		tools: ["invite-images"],
		params: [{
			name: "code",
			in: "query",
			type: "string",
			required: !0,
			description: "Invite code or full discord.gg link.",
			example: "aki"
		}, {
			name: "size",
			in: "query",
			type: "string",
			description: "CDN size. 16 to 4096.",
			default: "1024"
		}],
		handler: async (e) => {
			let t = q(H(e, "size", "1024"), sn, "size"), n = L(K(e, "code")), r = (await J(e).get(`/invites/${n}?with_counts=true&with_expiration=true`)).guild;
			return r ? {
				code: n,
				guild: {
					id: r.id,
					name: r.name,
					icon: r.icon,
					banner: r.banner
				},
				icon: ln(r.id, r.icon, t),
				banner: un(r.id, r.banner, t) ?? dn(r.id, r.splash, t),
				splash: dn(r.id, r.splash, t)
			} : {
				code: n,
				icon: null,
				banner: null,
				splash: null,
				guild: null
			};
		}
	},
	{
		id: "invites.build",
		method: "POST",
		path: `${B}/invites/build`,
		group: "Invites",
		summary: "Validate invite options and build the query string",
		description: "Discord only creates invites through an authenticated endpoint. This validates your options and returns the exact query string to send.",
		tools: ["invite-builder"],
		params: [
			Y("channel_id", "Channel the invite points at.", {
				required: !0,
				example: "197038439483310086"
			}),
			Y("guild_id", "Guild ID, for the invite payload."),
			Y("max_age", "Seconds before expiry.", {
				type: "number",
				default: 86400,
				example: "3600"
			}),
			Y("max_uses", "0 is unlimited.", {
				type: "number",
				default: 0
			}),
			Y("temporary", "Members get the Temporary Membership flag.", {
				type: "boolean",
				default: !1
			}),
			Y("unique", "Force a new code.", {
				type: "boolean",
				default: !0
			}),
			Y("target_type", "1 stream, 2 embedded application."),
			Y("target_id", "Target application or stream ID.")
		],
		handler: (e) => {
			let t = Nn({
				channelId: H(e, "channel_id"),
				guildId: H(e, "guild_id") || void 0,
				maxAge: U(e, "max_age", 86400),
				maxUses: U(e, "max_uses", 0),
				temporary: G(e, "temporary"),
				unique: G(e, "unique", !0),
				targetType: H(e, "target_type") ? Number(H(e, "target_type")) : void 0,
				targetId: H(e, "target_id") || void 0
			});
			if (!t.valid) throw new V(400, t.errors[0], t.errors);
			let n = new URLSearchParams(Object.entries(t.query).map(([e, t]) => [e, String(t)])).toString();
			return {
				...t,
				query: t.query,
				path: `/channels/${t.query.channel_id}/invites`,
				request: `POST /api/v10/channels/${t.query.channel_id}/invites?${n}`
			};
		}
	},
	{
		id: "webhooks.payload",
		method: "POST",
		path: `${B}/webhooks/payload`,
		group: "Webhooks",
		summary: "Build and validate a webhook payload",
		description: "Returns the JSON body, the character count and any limit warnings. Webhook URLs are never sent to this API.",
		tools: ["embed-builder"],
		params: [
			Y("username", "Webhook username override."),
			Y("avatar_url", "Webhook avatar override."),
			Y("content", "Message content."),
			Y("include_content", "Always include an empty content field.", {
				type: "boolean",
				default: !1
			}),
			Y("thread_id", "Send into a thread."),
			Y("embed", "Embed object: title, description, color, fields and so on.", { type: "object" })
		],
		handler: (e) => pn({
			embed: typeof e.body.embed == "object" && e.body.embed !== null ? e.body.embed : void 0,
			username: H(e, "username") || void 0,
			avatarUrl: H(e, "avatar_url") || void 0,
			content: H(e, "content") || void 0,
			includeContent: G(e, "include_content"),
			threadId: H(e, "thread_id") || void 0
		})
	},
	{
		id: "webhooks.limits",
		method: "GET",
		path: `${B}/webhooks/limits`,
		group: "Webhooks",
		summary: "Embed and webhook limits",
		description: "The numbers the Embed Builder checks against.",
		tools: ["embed-builder"],
		params: [],
		handler: () => ({
			limits: R,
			rateLimit: {
				perWebhook: "5 requests per 2 seconds",
				perChannel: "5 requests per 2 seconds",
				global: "50 requests per second"
			},
			note: "A 429 comes back with a retry_after in seconds and a global flag."
		})
	},
	{
		id: "webhooks.rpc",
		method: "POST",
		path: `${B}/webhooks/rpc`,
		group: "Webhooks",
		summary: "Build a rich presence payload",
		description: "The activity shape a bot or RPC client sends to show Playing, Listening to, Watching or Streaming. This endpoint only builds the JSON; it never connects to Discord. Requires no webhook and no token.",
		tools: ["rpc-preview"],
		params: [
			Y("text", "Main text, what you are doing.", {
				required: !0,
				example: "Baldur's Gate 3"
			}),
			Y("verb", "Which activity type to use.", {
				default: "playing",
				enum: w.map((e) => e.id)
			}),
			Y("state", "Optional second line."),
			Y("started_at", "Epoch milliseconds, for the elapsed clock.", { type: "number" }),
			Y("large_image", "Application icon key or URL."),
			Y("small_image", "Secondary icon key or URL.")
		],
		handler: (e) => {
			try {
				return {
					...ht({
						verb: q(H(e, "verb", "playing"), w.map((e) => e.id), "verb"),
						text: K(e, "text"),
						...H(e, "state") ? { state: H(e, "state") } : {},
						...H(e, "started_at") ? { startedAt: W(e, "started_at", Date.now(), 0, 41024448e5) } : {},
						...H(e, "large_image") ? { largeImage: H(e, "large_image") } : {},
						...H(e, "small_image") ? { smallImage: H(e, "small_image") } : {}
					}),
					verbs: w
				};
			} catch (e) {
				throw new V(400, e instanceof Error ? e.message : "Could not build that presence.");
			}
		}
	},
	{
		id: "permissions.compute",
		method: "POST",
		path: `${B}/permissions`,
		group: "Permissions",
		summary: "Convert permission names to an integer, or back",
		description: "Send names, an integer, or both. Unknown bits are reported rather than dropped.",
		tools: ["permission-calculator"],
		params: [Y("permissions", "Permission names, comma separated. Case and spacing do not matter.", { example: "View Channel,Send Messages" }), Y("integer", "Decimal, 0x hex or 0b binary integer.")],
		handler: (e) => {
			let t = Wn(e, "permissions"), n = H(e, "integer", "");
			if (t.length === 0 && n === "") throw new V(400, "Send \"permissions\" as names or \"integer\" as a value.");
			return n === "" ? {
				...kn(wn(t)),
				all: xn()
			} : {
				...kn(On(n)),
				all: xn()
			};
		}
	},
	{
		id: "permissions.list",
		method: "GET",
		path: `${B}/permissions/all`,
		group: "Permissions",
		summary: "Every permission with its bit",
		description: "Bits are strings because they exceed Number.MAX_SAFE_INTEGER in places.",
		tools: ["permission-calculator"],
		params: [],
		handler: () => ({ permissions: xn() })
	},
	{
		id: "emoji.library",
		method: "GET",
		path: `${B}/emojis`,
		group: "Emoji",
		summary: "Search the built-in emoji library",
		description: "The same data the Emoji Library tool renders.",
		tools: ["emoji-library"],
		params: [
			{
				name: "q",
				in: "query",
				type: "string",
				description: "Match against name, character or keywords.",
				example: "cat"
			},
			{
				name: "category",
				in: "query",
				type: "string",
				description: "Category id.",
				enum: [...O]
			},
			{
				name: "limit",
				in: "query",
				type: "number",
				description: "Maximum results, 1-500.",
				default: 100
			}
		],
		handler: (e) => {
			let t = H(e, "q").toLowerCase(), n = H(e, "category"), r = W(e, "limit", 100, 1, 500), i = Nt.filter((e) => n && e.category !== n ? !1 : !t || e.name.toLowerCase().includes(t) || e.keywords.some((e) => e.toLowerCase().includes(t)));
			return {
				total: i.length,
				returned: Math.min(i.length, r),
				categories: O,
				emojis: i.slice(0, r)
			};
		}
	},
	{
		id: "emoji.categories",
		method: "GET",
		path: `${B}/emojis/categories`,
		group: "Emoji",
		summary: "List emoji categories",
		description: "Category ids for the emoji search endpoint.",
		tools: ["emoji-library"],
		params: [],
		handler: () => O.map((e) => ({
			id: e,
			count: Nt.filter((t) => t.category === e).length
		}))
	},
	{
		id: "emoji.color-text",
		method: "POST",
		path: `${B}/emoji/color-text`,
		group: "Emoji",
		summary: "Get coloured text, or find out why you cannot",
		description: "Discord does not render coloured text in a normal message. Colour only appears inside embeds, which bots and webhooks can post. In block mode this returns nine shades of the colour for decoration. Block coverage is unreliable: some fonts and themes render them as plain rectangles or not at all, so never use them to convey meaning.",
		tools: ["color-text"],
		params: [
			Y("text", "Text to colour.", {
				required: !0,
				example: "coloured text"
			}),
			Y("hex", "Colour as a hex string.", {
				required: !0,
				example: "#5865f2"
			}),
			Y("mode", "embed for the payload a bot posts, blocks for the decoration.", {
				default: "embed",
				enum: ["embed", "blocks"]
			})
		],
		handler: (e) => {
			let t = K(e, "hex");
			if (!u(t)) throw new V(400, `"${t}" is not a hex colour. Use #RRGGBB.`);
			let n = t.startsWith("#") ? t.toLowerCase() : `#${t.toLowerCase()}`, r = d(n), i = parseInt(n.replace("#", "").slice(0, 6), 16), a = K(e, "text"), o = q(H(e, "mode", "embed"), ["embed", "blocks"], "mode"), s = Array.from({ length: 9 }, (e, t) => ie(n, (t - 4) / 4 * .55));
			return {
				mode: o,
				hex: n,
				decimal: i,
				rgb: r,
				embed: { embeds: [{
					description: a,
					color: i
				}] },
				blocks: s.map((e) => ({
					color: e,
					bar: "█".repeat(3)
				})),
				caveat: "Discord renders one message colour only. Embeds are the real answer; blocks are decoration."
			};
		}
	},
	{
		id: "codecs.base64",
		method: "POST",
		path: `${B}/base64`,
		group: "Developer",
		summary: "Base64 encode or decode",
		description: "Standard and URL-safe alphabets.",
		tools: ["base64"],
		params: [Y("input", "Value to convert.", {
			required: !0,
			example: "hello"
		}), Y("mode", "encode, decode, encodeUrl or decodeUrl.", {
			default: "encode",
			enum: [...Jn]
		})],
		handler: (i) => {
			let a = q(H(i, "mode", "encode"), Jn, "mode"), o = K(i, "input");
			return {
				mode: a,
				output: a === "encode" ? e(o) : a === "decode" ? t(o) : a === "encodeUrl" ? n(o) : r(o)
			};
		}
	},
	{
		id: "codecs.url",
		method: "POST",
		path: `${B}/url`,
		group: "Developer",
		summary: "Percent-encode or decode a URL component",
		description: "component mode also escapes !'()* the way encodeURIComponent should.",
		tools: ["url-encoder"],
		params: [Y("input", "Value to convert.", {
			required: !0,
			example: "a b&c"
		}), Y("mode", "encode, decode or component.", {
			default: "encode",
			enum: [...Yn]
		})],
		handler: (e) => {
			let t = q(H(e, "mode", "encode"), Yn, "mode"), n = K(e, "input");
			return {
				mode: t,
				output: t === "encode" ? a(n) : t === "decode" ? o(n) : a(n).replace(/[!'()*]/g, (e) => `%${e.charCodeAt(0).toString(16).toUpperCase()}`)
			};
		}
	},
	{
		id: "dev.json",
		method: "POST",
		path: `${B}/json`,
		group: "Developer",
		summary: "Format, minify or validate JSON",
		description: "Returns the output plus a structural summary of the document.",
		tools: ["json-tool"],
		params: [
			Y("input", "JSON text.", {
				required: !0,
				example: "{\"b\":1,\"a\":2}"
			}),
			Y("mode", "What to do with it.", {
				default: "pretty",
				enum: [...qn]
			}),
			Y("indent", "Spaces per level for pretty mode.", {
				type: "number",
				default: 2
			}),
			Y("sort_keys", "Sort object keys recursively.", {
				type: "boolean",
				default: !1
			})
		],
		handler: (e) => {
			let t = q(H(e, "mode", "pretty"), qn, "mode"), n = vn(K(e, "input"), t, {
				indent: W(e, "indent", 2, 0, 10),
				sortKeys: G(e, "sort_keys")
			});
			if (n.error) throw new V(400, n.error);
			let r = gn(K(e, "input"));
			return {
				mode: t,
				output: n.output,
				stats: r.data === null ? null : _n(r.data)
			};
		}
	},
	{
		id: "dev.uuid",
		method: "GET",
		path: `${B}/uuid`,
		group: "Developer",
		summary: "Generate v4 UUIDs",
		description: "Cryptographically random, from the platform CSPRNG.",
		tools: ["uuid-generator"],
		params: [{
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-100.",
			default: 1,
			example: "5"
		}],
		handler: (e) => {
			let t = W(e, "count", 1, 1, 100);
			return {
				count: t,
				uuids: Array.from({ length: t }, () => ot())
			};
		}
	},
	{
		id: "dev.color",
		method: "POST",
		path: `${B}/color`,
		group: "Developer",
		summary: "Convert a colour between every format",
		description: "Send hex, rgb() or hsl(). Returns hex, rgb, hsl, decimal and contrast data.",
		tools: [
			"color-converter",
			"hex-color-picker",
			"role-color-preview"
		],
		params: [
			Y("hex", "Hex colour, with or without the #.", { example: "#5865f2" }),
			Y("rgb", "RGB string or object.", { example: "88, 101, 242" }),
			Y("hsl", "HSL string or object.", { example: "235, 86%, 65%" })
		],
		handler: (e) => {
			let t = H(e, "hex"), n = H(e, "rgb"), r = H(e, "hsl"), i;
			if (t) {
				if (!u(t)) throw new V(400, `"${t}" is not a valid hex colour.`);
				i = d(t.startsWith("#") ? t : `#${t}`);
			} else if (n) i = typeof e.body.rgb == "object" && e.body.rgb !== null ? e.body.rgb : ne(n);
			else if (r) i = typeof e.body.hsl == "object" && e.body.hsl !== null ? te(e.body.hsl) : te(re(r));
			else throw new V(400, "Send one of \"hex\", \"rgb\" or \"hsl\".");
			let a = f(i), o = ee(i), s = oe(a);
			return {
				hex: a,
				rgb: i,
				hsl: o,
				rgbString: `rgb(${i.r}, ${i.g}, ${i.b})`,
				hslString: `hsl(${o.h}, ${o.s}%, ${o.l}%)`,
				decimal: parseInt(a.slice(1), 16),
				luminance: Math.round(p(i) * 1e4) / 1e4,
				label: se(a),
				contrast: s
			};
		}
	},
	{
		id: "dev.password",
		method: "POST",
		path: `${B}/password`,
		group: "Developer",
		summary: "Generate a password and score it",
		description: "Character pools are configurable. Scoring matches the Password Generator tool.",
		tools: ["password-generator"],
		params: [
			Y("length", "Characters, 4-128.", {
				type: "number",
				default: S.length,
				example: "24"
			}),
			Y("uppercase", "Include A-Z.", {
				type: "boolean",
				default: S.uppercase
			}),
			Y("lowercase", "Include a-z.", {
				type: "boolean",
				default: S.lowercase
			}),
			Y("digits", "Include 0-9.", {
				type: "boolean",
				default: S.digits
			}),
			Y("symbols", "Include punctuation.", {
				type: "boolean",
				default: S.symbols
			}),
			Y("avoid_ambiguous", "Drop l, 1, I, O, 0 and similar.", {
				type: "boolean",
				default: S.avoidAmbiguous
			})
		],
		handler: (e) => {
			let t = {
				length: W(e, "length", S.length, 4, 128),
				uppercase: G(e, "uppercase", S.uppercase),
				lowercase: G(e, "lowercase", S.lowercase),
				digits: G(e, "digits", S.digits),
				symbols: G(e, "symbols", S.symbols),
				avoidAmbiguous: G(e, "avoid_ambiguous", S.avoidAmbiguous)
			};
			if (!t.uppercase && !t.lowercase && !t.digits && !t.symbols) throw new V(400, "Leave at least one character set enabled.");
			let n = it(t);
			return {
				password: n,
				strength: at(n),
				options: t
			};
		}
	},
	{
		id: "dev.token",
		method: "POST",
		path: `${B}/token/decode`,
		group: "Developer",
		summary: "Read the structure of a token",
		description: "Decodes locally and sends nothing onward. The third segment is masked before it leaves the handler.",
		tools: ["token-inspector"],
		params: [Y("token", "A token you already own.", { required: !0 })],
		handler: (e) => {
			let t = K(e, "token"), n = Pn(t);
			return {
				valid: n.valid,
				error: n.error ?? null,
				userId: n.userId,
				issuedAt: n.issuedAtIso,
				segmentCount: n.segments.length,
				masked: Fn(t)
			};
		}
	},
	{
		id: "dev.timestamp",
		method: "POST",
		path: `${B}/timestamp`,
		group: "Developer",
		summary: "Convert a date to Discord timestamp formats",
		description: "Every style the Timestamp Generator shows.",
		tools: ["timestamp-generator"],
		params: [Y("date", "ISO date or timestamp. Defaults to now.", { example: "2024-01-01T00:00:00Z" })],
		handler: (e) => {
			let t = H(e, "date"), n = t ? T(t) : /* @__PURE__ */ new Date(), r = he(n);
			return {
				iso: n.toISOString(),
				epochSeconds: Math.floor(n.getTime() / 1e3),
				epochMilliseconds: n.getTime(),
				unix: r.unix,
				relative: r.relative,
				isoString: r.iso,
				styles: {
					shortTime: r.shortTime,
					longTime: r.longTime,
					shortDate: r.shortDate,
					longDate: r.longDate,
					relative: r.relative
				},
				tags: r.tags,
				relativeText: ge(n)
			};
		}
	},
	{
		id: "dev.message-link",
		method: "GET",
		path: `${B}/message-links`,
		group: "Developer",
		summary: "Split a message link into IDs",
		description: "Works for server messages, DMs and threads.",
		tools: ["message-link"],
		params: [{
			name: "url",
			in: "query",
			type: "string",
			required: !0,
			description: "A discord.com message link.",
			example: "https://discord.com/channels/197038439483310086/123456789012345678/123456789012345679"
		}],
		handler: (e) => {
			let t = jn(K(e, "url"));
			if (!t) throw new V(400, "That does not look like a Discord message link.");
			return {
				...t,
				jump: `https://discord.com/channels/${t.guildId}/${t.channelId}/${t.messageId}`
			};
		}
	},
	{
		id: "dev.markdown",
		method: "GET",
		path: `${B}/markdown`,
		group: "Developer",
		summary: "Discord markdown reference",
		description: "The table behind the Markdown Guide tool.",
		tools: ["markdown-guide"],
		params: [],
		handler: () => _e
	},
	{
		id: "dev.badges",
		method: "GET",
		path: `${B}/badges`,
		group: "Discord",
		summary: "List every user badge",
		description: "Badge ids and descriptions, for building a badge viewer.",
		tools: ["badge-library", "badge-checker"],
		params: [],
		handler: () => ({
			groups: ue,
			badges: le
		})
	},
	{
		id: "misc.vtt",
		method: "POST",
		path: `${B}/vtt`,
		group: "Misc",
		summary: "Parse WebVTT captions",
		description: "Returns cue timings in seconds plus a Discord soundboard payload.",
		tools: ["vtt-tool"],
		params: [Y("input", "VTT file contents.", { required: !0 })],
		handler: (e) => zn(K(e, "input"))
	},
	{
		id: "misc.age",
		method: "POST",
		path: `${B}/age`,
		group: "Misc",
		summary: "Age statistics for a date",
		description: "Same breakdown as the Age Tool.",
		tools: ["age-tool"],
		params: [Y("dob", "Date of birth, YYYY-MM-DD or ISO.", {
			required: !0,
			example: "2000-04-01"
		}), Y("from", "Reference date. Defaults to now.", { example: "2026-01-01" })],
		handler: (e) => {
			let t = T(K(e, "dob")), n = H(e, "from");
			return bt(t, n ? T(n) : /* @__PURE__ */ new Date());
		}
	},
	{
		id: "misc.countdown",
		method: "POST",
		path: `${B}/countdown`,
		group: "Misc",
		summary: "Format seconds as a countdown",
		description: "Returns the breakdown the Countdown tool renders.",
		tools: ["countdown"],
		params: [Y("seconds", "Total seconds.", {
			type: "number",
			required: !0,
			example: "93784"
		})],
		handler: (e) => {
			let t = U(e, "seconds", 0);
			return {
				seconds: t,
				formatted: _t(t),
				days: Math.floor(t / 86400),
				hours: Math.floor(t % 86400 / 3600),
				minutes: Math.floor(t % 3600 / 60),
				remainingSeconds: Math.floor(t % 60)
			};
		}
	},
	{
		id: "misc.sounds",
		method: "GET",
		path: `${B}/sounds`,
		group: "Misc",
		summary: "List the synthesised soundboard",
		description: "Audio is generated with the Web Audio API, so there is nothing to download. This returns the definitions.",
		tools: ["soundboard", "discord-sfx"],
		params: [],
		handler: () => ({
			count: E.length,
			groups: Array.from(new Set(E.map((e) => e.group))),
			sounds: E.map((e) => ({
				id: e.id,
				name: e.name,
				group: e.group,
				duration: e.duration,
				description: e.description,
				tones: e.tones?.length ?? 0,
				noise: e.noise?.length ?? 0
			}))
		})
	},
	{
		id: "gen.username",
		method: "GET",
		path: `${B}/generate/usernames`,
		group: "Generators",
		summary: "Generate usernames",
		description: "Every username style the generator offers.",
		tools: ["username-generator"],
		params: [{
			name: "style",
			in: "query",
			type: "string",
			description: "Style id.",
			default: "aesthetic",
			enum: [
				"aesthetic",
				"minimal",
				"gamer",
				"leetspeak",
				"twoWord",
				"symbolic"
			]
		}, {
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-50.",
			default: 10
		}],
		handler: (e) => {
			let t = H(e, "style", "aesthetic"), n = W(e, "count", 10, 1, 50);
			return {
				style: t,
				count: n,
				usernames: Ee(t, n)
			};
		}
	},
	{
		id: "gen.nickname",
		method: "GET",
		path: `${B}/generate/nicknames`,
		group: "Generators",
		summary: "Generate nicknames",
		description: "Shorter, plainer versions of the username list.",
		tools: ["nickname-generator"],
		params: [{
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-50.",
			default: 10
		}],
		handler: (e) => ({ nicknames: Ke(W(e, "count", 10, 1, 50)) })
	},
	{
		id: "gen.bio",
		method: "GET",
		path: `${B}/generate/bio`,
		group: "Generators",
		summary: "Generate a bio",
		description: "One line bios that fit Discord's 190 character custom status.",
		tools: ["bio-generator"],
		params: [{
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-50.",
			default: 10
		}],
		handler: (e) => ({ bios: Array.from({ length: W(e, "count", 10, 1, 50) }, () => Ue()) })
	},
	{
		id: "gen.server",
		method: "GET",
		path: `${B}/generate/server`,
		group: "Generators",
		summary: "Generate a server name",
		description: "Also returns a matching channel set.",
		tools: ["server-name-generator", "channel-name-generator"],
		params: [{
			name: "channels",
			in: "query",
			type: "number",
			description: "Channel names, 1-30.",
			default: 8
		}],
		handler: (e) => ({
			server: Ae(),
			role: Ne(),
			channels: Pe(W(e, "channels", 8, 1, 30))
		})
	},
	{
		id: "gen.channel",
		method: "GET",
		path: `${B}/generate/channels`,
		group: "Generators",
		summary: "Generate channel names",
		description: "Lowercase, hyphenated, Discord-safe.",
		tools: ["channel-name-generator"],
		params: [{
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-50.",
			default: 10
		}],
		handler: (e) => ({ channels: Array.from({ length: W(e, "count", 10, 1, 50) }, () => je()) })
	},
	{
		id: "gen.role",
		method: "GET",
		path: `${B}/generate/roles`,
		group: "Generators",
		summary: "Generate role names",
		description: "With a suggested hex colour for each.",
		tools: ["role-name-generator"],
		params: [{
			name: "count",
			in: "query",
			type: "number",
			description: "How many, 1-50.",
			default: 10
		}],
		handler: (e) => ({
			roles: Array.from({ length: W(e, "count", 10, 1, 50) }, () => Me()),
			palette: ce
		})
	},
	{
		id: "gen.rules",
		method: "POST",
		path: `${B}/generate/rules`,
		group: "Generators",
		summary: "Assemble a rules template",
		description: "Pick template titles and this fills in the wording.",
		tools: ["rules-generator"],
		params: [Y("titles", "Template titles to include.", {
			required: !0,
			example: "Be respectful,No spam"
		}), Y("server_name", "Substituted into the wording.")],
		handler: (e) => {
			let t = Wn(e, "titles"), n = t.length ? x.filter((e) => t.some((t) => t.toLowerCase() === e.id || t.toLowerCase() === e.name.toLowerCase())) : x.slice(0, 6);
			if (t.length > 0 && n.length === 0) throw new V(400, `None of those matched a template. Try one of: ${x.map((e) => e.id).join(", ")}.`);
			let r = {
				serverName: H(e, "server_name", "the server"),
				tone: q(H(e, "tone", "friendly"), [
					"friendly",
					"strict",
					"minimal"
				], "tone"),
				numbering: q(H(e, "numbering", "numbers"), ["numbers", "bullets"], "numbering")
			}, i = Ye(n, r);
			return {
				rules: i,
				count: i.length,
				templates: n,
				options: r
			};
		}
	},
	{
		id: "gen.welcome",
		method: "POST",
		path: `${B}/generate/welcome`,
		group: "Generators",
		summary: "Assemble a welcome message",
		description: "Server name and member count are substituted into the template.",
		tools: ["welcome-generator"],
		params: [
			Y("server_name", "Server name.", {
				required: !0,
				example: "Aki's Tools"
			}),
			Y("user_name", "Name of the member being welcomed.", {
				default: "friend",
				example: "dani"
			}),
			Y("member_count", "Member count shown in the message.", {
				type: "number",
				example: "1284"
			}),
			Y("channel_name", "Channel to point them at.", { example: "rules" }),
			Y("rules_url", "Link to the rules.", { example: "https://discord.gg/aki" }),
			Y("style", "embed, plain or image.", {
				default: "plain",
				enum: [
					"embed",
					"plain",
					"image"
				]
			}),
			Y("accent", "Hex colour for the embed style.", {
				default: "#5865f2",
				example: "#5865f2"
			})
		],
		handler: (e) => {
			let t = {
				serverName: K(e, "server_name"),
				userName: H(e, "user_name", "friend"),
				memberCount: U(e, "member_count", 0),
				rulesUrl: H(e, "rules_url") || void 0,
				channelName: H(e, "channel_name") || void 0,
				style: q(H(e, "style", "plain"), [
					"embed",
					"plain",
					"image"
				], "style"),
				accent: H(e, "accent", "#5865f2")
			};
			return {
				message: Xe(t),
				options: t
			};
		}
	}
];
function Z(e, t = 200, n = {}) {
	return new Response(JSON.stringify(e, null, 2), {
		status: t,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			...n
		}
	});
}
var Q = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Max-Age": "86400"
};
function Zn(e) {
	return e.split("/").filter(Boolean);
}
function Qn(e, t) {
	let n = Zn(e), r = Zn(t);
	if (n.length !== r.length) return null;
	let i = {};
	for (let [e, t] of n.entries()) {
		let n = r[e];
		if (t.startsWith(":")) {
			i[t.slice(1)] = decodeURIComponent(n);
			continue;
		}
		if (t !== n) return null;
	}
	return i;
}
function $n(e, t) {
	return t === e.method || e.method === "POST" && t === "GET";
}
function er(e = {}) {
	let t = e.config ?? Vn, n = e.version ?? "1", r = /* @__PURE__ */ new Map(), i = (t) => {
		if (!e.rateLimit) return null;
		let { limit: n, windowMs: i } = e.rateLimit, a = t.headers.get("CF-Connecting-IP") ?? "anonymous", o = Date.now(), s = r.get(a);
		return !s || o > s.reset ? (r.set(a, {
			count: 1,
			reset: o + i
		}), null) : (s.count += 1, s.count > n ? new V(429, "Too many requests. Slow down.") : null);
	}, a = (e) => ({
		id: e.id,
		method: "GET",
		path: e.path,
		group: e.group,
		summary: e.summary,
		tools: e.tools,
		params: e.params
	}), o = (e) => {
		let r = {}, i = (e) => ({
			type: e.type === "number" ? "number" : e.type === "boolean" ? "boolean" : "string",
			...e.default === void 0 ? {} : { default: e.default },
			...e.enum ? { enum: e.enum } : {}
		});
		for (let e of X) {
			let t = e.path.replace(/:([A-Za-z_]+)/g, "{$1}"), n = {
				200: {
					description: "Success.",
					content: { "application/json": { schema: { type: "object" } } }
				},
				400: { description: "Bad request." }
			}, a = e.params.filter((e) => e.in !== "body").map((e) => ({
				name: e.name,
				in: e.in,
				required: !!e.required,
				description: e.description,
				...e.example ? { example: e.example } : {},
				schema: i(e)
			})).concat(e.params.filter((e) => e.in === "body").map((e) => ({
				name: e.name,
				in: "query",
				required: !!e.required,
				description: e.description,
				...e.type === "string[]" ? {
					style: "form",
					explode: !0
				} : {},
				...e.example ? { example: e.example } : {},
				schema: i(e)
			}))), o = e.params.filter((e) => e.in === "body"), s = o.length > 0 ? {
				required: o.some((e) => e.required),
				content: { "application/json": { schema: {
					type: "object",
					properties: Object.fromEntries(o.map((e) => [e.name, {
						...i(e),
						...e.type === "string[]" ? {
							type: "array",
							items: { type: "string" }
						} : {},
						...e.description ? { description: e.description } : {},
						...e.example ? { example: e.example } : {}
					}]))
				} } }
			} : void 0, c = (t, r, i) => ({ [t]: {
				summary: e.summary,
				description: t === "get" ? e.description : `${e.description}\n\nThe POST form takes the same parameters in a JSON body. It is not served by GitHub Pages, which only answers GET and HEAD, but it is what a self-hosted copy of this handler expects.`,
				tags: [e.group],
				operationId: t === "get" ? e.id : `${e.id}Post`,
				...r.length ? { parameters: r } : {},
				...i ? { requestBody: i } : {},
				responses: n
			} });
			r[t] = {
				...c("get", a),
				...e.method === "POST" ? c("post", [], s) : {}
			};
		}
		return {
			openapi: "3.1.0",
			info: {
				title: `${t.service_name} API`,
				version: n,
				description: "Read-only helpers that mirror the tools on the site. No authentication, no user data stored. Webhook URLs are never accepted.\n\nEvery endpoint is a pure function served from static files, so the canonical method is GET with query parameters. POST is accepted too by any self-hosted copy of the handler.",
				license: {
					name: t.license,
					url: `${e}/LICENSE`
				}
			},
			servers: [{ url: e }],
			tags: Array.from(new Set(X.map((e) => e.group))).map((e) => ({ name: e })),
			paths: r
		};
	}, s = () => {
		let r = Array.from(new Set(X.map((e) => e.group))).map((e) => ({
			name: e,
			endpoints: X.filter((t) => t.group === e).map(a)
		}));
		return {
			name: `${t.service_name} API`,
			version: n,
			openapi: `${B}/openapi.json`,
			docs: `${(e.origin ?? Un).replace(/^https?:\/\//, "")}/docs`,
			client: `${B}/client.js`,
			endpoints: X.length,
			groups: r
		};
	}, c = () => {
		let e = /* @__PURE__ */ new Map();
		for (let t of X) for (let n of t.tools) {
			let r = e.get(n) ?? {
				endpoints: [],
				requests: []
			};
			r.endpoints.push(`${t.method} ${t.path}`), t.group === "Discord" && r.requests.push(`GET ${an}${tr(t)}`), e.set(n, r);
		}
		return Object.fromEntries(e);
	};
	return {
		handle: async (t) => {
			if (t.method === "OPTIONS") return new Response(null, {
				status: 204,
				headers: Q
			});
			let r = new URL(t.url), a = r.pathname.replace(/\/+$/, "") || "/", l = i(t);
			if (l) return Z({ error: {
				message: l.message,
				status: 429
			} }, 429, Q);
			if (a === `${B}` || a === `${B}/` || a === "/api") return Z(s(), 200, Q);
			if (a === `${B}/health`) return Z({
				status: "ok",
				version: n,
				uptime: null
			}, 200, Q);
			if (a === `${B}/openapi.json`) return Z(o(e.origin ?? r.origin), 200, Q);
			if (a === `${B}/tools`) return Z({ tools: c() }, 200, Q);
			let u = {};
			if (t.method === "POST") {
				if ((t.headers.get("Content-Type") ?? "").includes("application/json")) try {
					u = await t.json() ?? {};
				} catch {
					return Z({ error: {
						message: "Request body is not valid JSON.",
						status: 400
					} }, 400, Q);
				}
				else {
					let e = await t.formData();
					u = Object.fromEntries(e.entries());
				}
			}
			for (let n of X) {
				let i = Qn(n.path, a);
				if (!i || !$n(n, t.method)) continue;
				let o = {
					path: i,
					query: r.searchParams,
					body: u,
					...e.discord ? { discord: e.discord } : {}
				};
				try {
					return Z({
						data: await n.handler(o),
						endpoint: n.id,
						method: t.method,
						path: a
					}, 200, {
						...Q,
						"Cache-Control": n.group === "Discord" ? "public, max-age=60" : "no-store"
					});
				} catch (e) {
					return e instanceof V ? Z({
						error: {
							message: e.message,
							status: e.status,
							...e.details ? { details: e.details } : {}
						},
						endpoint: n.id
					}, e.status, Q) : Z({
						error: {
							message: e instanceof Error ? e.message : "Something went wrong handling that.",
							status: 400
						},
						endpoint: n.id
					}, 400, Q);
				}
			}
			let d = X.some((e) => Qn(e.path, a));
			return Z({ error: {
				message: d ? `${t.method} is not allowed on ${a}.` : `No endpoint at ${a}. See ${B} for the list.`,
				status: d ? 405 : 404
			} }, d ? 405 : 404, Q);
		},
		openapi: o,
		index: s,
		endpoints: X,
		toolIndex: c
	};
}
function tr(e) {
	switch (e.id) {
		case "ids.user": return "/users/:id";
		case "ids.guild": return "/guilds/:id";
		case "ids.invite": return "/invites/:code";
		case "ids.emoji": return "/emojis/:id";
		case "ids.snowflake-exists": return "/users/:id";
		default: return e.path;
	}
}
//#endregion
//#region src/lib/core/client.ts
var $ = typeof globalThis.location == "object" && "origin" in globalThis.location && globalThis.location.origin !== "null" ? globalThis.location.origin : Un, nr = er({
	origin: $,
	discord: { async get(e, t) {
		let n = await fetch(`https://discord.com/api/v10${e}`, {
			...t ? { signal: t } : {},
			headers: { Accept: "application/json" }
		});
		if (!n.ok) throw Error(`Discord answered ${n.status} for ${e}.`);
		return n.json();
	} }
}), rr = class extends Error {
	status;
	payload;
	constructor(e, t, n) {
		super(t), this.name = "ApiRequestError", this.status = e, this.payload = n;
	}
};
function ir(e) {
	return `${B}${e.startsWith("/") ? e : `/${e}`}`.replace(/\/+$/, "");
}
async function ar(e) {
	let t = await nr.handle(e), n = await t.json().catch(() => null);
	if (!t.ok) {
		let e = n?.error;
		throw new rr(t.status, e?.message ?? `Request failed with ${t.status}.`, n);
	}
	return n;
}
function or(e, t) {
	let n = new URLSearchParams();
	for (let [e, r] of Object.entries(t ?? {})) if (r != null && r !== "") {
		if (Array.isArray(r)) for (let t of r) n.append(e, String(t));
		else n.set(e, String(r));
	}
	let r = n.toString();
	return r ? `${e}?${r}` : e;
}
var sr = {
	async get(e, t) {
		return await ar(new Request(`${$}${or(ir(e), t)}`, { method: "GET" }));
	},
	async post(e, t) {
		return await ar(new Request(`${$}${ir(e)}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(t ?? {})
		}));
	},
	url(e, t) {
		return `${$}${or(ir(e), t)}`;
	},
	request(e, t) {
		return nr.handle(e instanceof Request ? e : new Request(e, t));
	}
};
function cr(e) {
	return X.find((t) => t.id === e || t.path === e);
}
//#endregion
export { B as API_PREFIX, rr as ApiRequestError, Un as DEFAULT_ORIGIN, X as ENDPOINTS, sr as api, er as createApi, cr as findEndpoint };
