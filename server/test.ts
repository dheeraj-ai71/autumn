import "dotenv/config";
import Stripe from "stripe";

const main = async () => {
	const stripe = new Stripe(process.env.STRIPE_SANDBOX_SECRET_KEY || "");
    const stripe_webhook_url = process.env.STRIPE_WEBHOOK_URL || "";
    if (!stripe_webhook_url) {
        throw new Error("STRIPE_WEBHOOK_URL env variable is not set");
    }
    console.log("Using webhook URL:", `https://${stripe_webhook_url}/webhooks/connect/sandbox`);
	const result = await stripe.webhookEndpoints.create({
		url: `${stripe_webhook_url}/webhooks/connect/sandbox`,
		enabled_events: [
			"checkout.session.completed",
			"customer.subscription.created",
			"customer.subscription.updated",
			"customer.subscription.deleted",
			"customer.discount.deleted",
			"invoice.paid",
			"invoice.upcoming",
			"invoice.created",
			"invoice.finalized",
			"invoice.updated",
			"subscription_schedule.canceled",
			"subscription_schedule.updated",
		],
		connect: true,
	});

	console.log(result);

	// const account = await stripe.v2.core.accounts.create({
	// 	contact_email: "johnyeo10@gmail.com",
	// 	display_name: "John Yeo",
	// 	dashboard: "full",
	// 	identity: {
	// 		country: "us",
	// 	},
	// 	configuration: {
	// 		merchant: {},
	// 	},
	// 	defaults: {
	// 		responsibilities: {
	// 			losses_collector: "stripe",
	// 			fees_collector: "stripe",
	// 		},
	// 	},
	// });
	// console.log(account);

	// console.log(result);

	// const result = await stripe.v2.core.accounts.create({
	// 	contact_email: "johnyeo10@gmail.com",
	// 	display_name: "John Yeo",
	// 	dashboard: "full",
	// 	identity: {
	// 		country: "us",
	// 	},
	// 	configuration: {
	// 		merchant: {},
	// 	},
	// 	defaults: {
	// 		responsibilities: {
	// 			losses_collector: "stripe",
	// 			fees_collector: "stripe",
	// 		},
	// 	},
	// });
	// console.log(result);

	// const accountLink = await stripe.accountLinks.create({
	// 	account: "acct_1SIqs0RAB2jVVcNG",
	// 	refresh_url: "https://useautumn.com/refresh",
	// 	return_url: "https://useautumn.com/return",
	// 	type: "account_onboarding",
	// });
	// console.log(accountLink);
};

main()
	.catch(console.error)
	.then(() => process.exit(0));
