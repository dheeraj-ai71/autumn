import { AppEnv } from "@autumn/shared";
import type { Context } from "hono";
import { initDrizzle } from "@/db/initDrizzle.js";
import { createStripeCli } from "@/external/connect/createStripeCli.js";
import { initMasterStripe } from "@/external/connect/initStripeCli.js";
import type { HonoEnv } from "@/honoUtils/HonoEnv.js";
import { OrgService } from "@/internal/orgs/OrgService.js";
import { consumeOAuthState } from "@/internal/platform/platformBeta/utils/oauthStateUtils.js";
import { registerConnectWebhook } from "@/external/connect/registerConnectWebhook.js";
/**
 * Handles Stripe OAuth callback
 * Uses Redis state for both standard and platform flows
 */
export const handleOAuthCallback = async (c: Context<HonoEnv>) => {
	const query = c.req.query();
	const { code, state, error } = query;

	// Get database connection
	const { db } = initDrizzle();

	// Build frontend redirect URL (default)
	const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
	let redirectUrl = new URL(`${frontendUrl}`);
	redirectUrl.searchParams.set("tab", "stripe");

	// Handle OAuth error from Stripe
	if (error) {
		redirectUrl.searchParams.set("error", error);
		return c.redirect(redirectUrl.toString());
	}

	// Validate required parameters
	if (!code || !state) {
		redirectUrl.searchParams.set("error", "missing_parameters");
		return c.redirect(redirectUrl.toString());
	}

	try {
		// Consume OAuth state from Redis
		const redisState = await consumeOAuthState({ stateKey: state });

		if (!redisState) {
			redirectUrl.searchParams.set("error", "invalid_state");
			return c.redirect(redirectUrl.toString());
		}

		// Extract state data
		const {
			organization_slug,
			env: envStr,
			redirect_uri,
			master_org_id,
		} = redisState;
		const env = envStr === "live" ? AppEnv.Live : AppEnv.Sandbox;
		const isPlatformFlow = master_org_id !== null;

		// Use custom redirect URI if provided (platform flow)
		if (isPlatformFlow) {
			redirectUrl = new URL(redirect_uri);
		} else {
			redirectUrl = redirect_uri
				? new URL(redirect_uri)
				: new URL(
						`${frontendUrl}${env === AppEnv.Sandbox ? "/sandbox" : ""}/dev?tab=stripe`,
					);
		}

		// Fetch the organization by slug
		const org = await OrgService.getBySlug({ db, slug: organization_slug });

		if (!org) {
			console.error("Organization not found:", organization_slug);
			redirectUrl.searchParams.set("error", "org_not_found");
			return c.redirect(redirectUrl.toString());
		}

		const stripe = initMasterStripe({ env });
		const response = await stripe.oauth.token({
			grant_type: "authorization_code",
			code,
		});

		const accountId = response.stripe_user_id;

		if (!accountId) {
			console.error("Account ID not found");
			redirectUrl.searchParams.set("error", "account_id_not_found");
			return c.redirect(redirectUrl.toString());
		}

		// Check if account ID is already connected to another organization
		const existingOrg = await OrgService.findByStripeAccountId({
			db,
			accountId,
			env,
		});

		if (existingOrg) {
			console.error(
				`Account ${accountId} is already connected to org ${existingOrg.id}`,
			);

			// Platform flow just returns error code
			if (isPlatformFlow) {
				redirectUrl.searchParams.set("error", "account_already_connected");
				return c.redirect(redirectUrl.toString());
			}

			// Standard flow returns detailed error
			const master = createStripeCli({ org: existingOrg, env });
			const account = await master.accounts.retrieve(accountId);
			redirectUrl.searchParams.set("error", "account_already_connected");
			redirectUrl.searchParams.set("account_id", accountId);
			redirectUrl.searchParams.set("account_name", account.company?.name || "");
			redirectUrl.searchParams.set(
				"connected_org_name",
				existingOrg.name || "",
			);
			redirectUrl.searchParams.set(
				"connected_org_slug",
				existingOrg.slug || "",
			);
			return c.redirect(redirectUrl.toString());
		}

		// Update organization with Stripe Connect account
		await OrgService.updateStripeConnect({
			db,
			orgId: org.id,
			accountId,
			env,
		});
        
        // Set up webhooks using the same logic as manual API
        // try {
        //     const masterSecretKey = env === AppEnv.Sandbox 
        //         ? process.env.STRIPE_SANDBOX_SECRET_KEY 
        //         : process.env.STRIPE_LIVE_SECRET_KEY;
            
        //     if (!masterSecretKey) {
        //         throw new Error(`Master Stripe ${env} secret key not found`);
        //     }
            
        //     // Reuse existing handleStripeSecretKey function (same as manual API)
        //     const { handleStripeSecretKey } = await import("@/internal/orgs/orgUtils/handleStripeSecretKey.js");
            
        //     const result = await handleStripeSecretKey({
        //         orgId: org.id,
        //         secretKey: masterSecretKey,
        //         env,
        //     });
            
        //     // Update organization with the result (same as manual API)
        //     const currentConfig = org.stripe_config || {};
        //     const configUpdates = {
        //         ...currentConfig,
        //         ...(env === AppEnv.Sandbox 
        //             ? { 
        //                 test_api_key: result.test_api_key,
        //                 test_webhook_secret: result.test_webhook_secret 
        //             }
        //             : { 
        //                 live_api_key: result.live_api_key,
        //                 live_webhook_secret: result.live_webhook_secret 
        //             }
        //         )
        //     };
            
        //     await OrgService.update({
        //         db,
        //         orgId: org.id,
        //         updates: {
        //             stripe_config: configUpdates,
        //         },
        //     });
            
        //     console.log(`Successfully set up webhooks using existing handleStripeSecretKey for org ${org.id}`);
        // } catch (webhookError) {
        //     console.error("Failed to set up webhooks:", webhookError);
        //     // Continue with OAuth success even if webhook setup fails
        // }

		// console.log(`Successfully connected Stripe account for org ${org.id}`);

		// Redirect to success
		redirectUrl.searchParams.set("success", "true");
		return c.redirect(redirectUrl.toString());
	} catch (error: unknown) {
		console.error("Error in OAuth callback:", error);
		redirectUrl.searchParams.set(
			"error",
			error instanceof Error ? error.message : "unknown_error",
		);
		return c.redirect(redirectUrl.toString());
	}
};
