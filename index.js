const DOMAIN = {
	address: "0x706d9b70726442e43803942af2468795be824a95",
	chainId: 4,
	name: "Peeps",
};
const {createAvatar} = require("@dicebear/avatars");
const style = require("@dicebear/open-peeps");
const Nuron = require("nuronjs");
const express = require("express");
const nuron = new Nuron({
	key: "m'/44'/60'/0'/0/0",
	workspace: "open-peeps",
	domain: DOMAIN,
});
const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/index.html");
});
app.post("/create", async (req, res) => {
	// 1. generate svg
	let svg = createAvatar(style, {seed: req.body.seed});

	// 2. write the svg to the nuron file system and get its IPFS cid
	let svg_cid = await nuron.fs.write(Buffer.from(svg));

	// 3. write the metadata to the nuron file system and get its IPFS cid
	let metadata_cid = await nuron.fs.write({
		name: req.body.seed,
		description: `${req.body.seed}.svg`,
		image: `ipfs://${svg_cid}`,
		mime: {[svg_cid]: "image/svg+xml"},
	});

	// 4. create a token from the metadata cid
	let token = await nuron.token.create({
		cid: metadata_cid,
	});

	// 5. pin all the files (both svg and metadata)
	await nuron.fs.pin(svg_cid);
	await nuron.fs.pin(metadata_cid);

	// 6. return the created token as response. the user will take this token and mint it from the frontend
	res.json({
		token: token,
		svg: svg,
	});
});
app.listen(3000);
