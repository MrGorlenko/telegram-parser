import express from "express";
import dotenv from "dotenv";

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { NewMessage } from "telegram/events";
const input = require("input");

dotenv.config();

const app = express();

const apiId = parseFloat(process.env.API_ID || "");
const apiHash = process.env.API_HASH || "";
const stringSession = new StringSession("");

(async () => {
	console.log("Loading...");
	const client = new TelegramClient(stringSession, apiId, apiHash, {
		connectionRetries: 5,
	});
	await client.start({
		phoneNumber: async () => await input.text("Please enter your number: "),
		password: async () => await input.text("Please enter your password: "),
		phoneCode: async () =>
			await input.text("Please enter the code you received: "),
		onError: (err) => console.log(err),
	});

	const dialogs = await client.getDialogs();
	const names = process.env.CHANNEL_NAMES_TO_PARSE?.split(",") || [];
	const finalChatName = process.env.CHANNEL_NAME_TO_FORWARD || "";

	const chatsIds = dialogs
		.filter((dialog: any) => names.includes(dialog.name))
		.map((dialog: any) => dialog.id);

	const chatsIdsBigInt = chatsIds.map((id) => id.value);

	const destinationChatId =
		dialogs.find((dialog: any) => finalChatName === dialog.name)?.id || "";

	client.addEventHandler(async (update: any) => {
		if (
			update.message &&
			chatsIdsBigInt.includes(update.message.chatId.value)
		) {
			await client.forwardMessages(destinationChatId, {
				messages: update.message.id,
				fromPeer: update.message.chatId.value.toString(),
			});
		}
	}, new NewMessage({}));
})();

app.listen(3000, "0.0.0.0");
