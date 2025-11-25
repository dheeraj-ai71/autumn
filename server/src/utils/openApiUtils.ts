/**
 * Returns the OpenAPI specification as a JavaScript object for use with Scalar or other API documentation tools
 */
export const getOpenApiSpec = () => {
	const serverUrl =
		process.env.NODE_ENV === "development"
			? `http://localhost:${process.env.BACKEND_PORT || process.env.SERVER_PORT || 8082}/v1`
			: "https://api.useautumn.com/v1";

	return {
		openapi: "3.1.0",
		info: {
			title: "Autumn API",
			version: "1.2.0",
			description:
				"The Autumn API allows you to manage products, features, customers, and usage tracking for your monetization platform.",
		},
		servers: [
			{
				url: serverUrl,
				description:
					process.env.NODE_ENV === "development"
						? "Development server"
						: "Production server",
			},
		],
		security: [
			{
				bearerAuth: [],
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "string",
					description: "Use your secret API key as a Bearer token",
				},
			},
			schemas: {
				Customer: {
					type: "object",
					properties: {
						id: { type: "string" },
						email: { type: "string" },
						name: { type: "string" },
						created_at: { type: "string", format: "date-time" },
					},
				},
				Product: {
					type: "object",
					properties: {
						id: { type: "string" },
						name: { type: "string" },
						description: { type: "string" },
						features: { type: "array", items: { type: "string" } },
					},
				},
				Feature: {
					type: "object",
					properties: {
						id: { type: "string" },
						name: { type: "string" },
						type: {
							type: "string",
							enum: [
								"boolean",
								"single_use",
								"continuous_use",
								"credit_system",
							],
						},
					},
				},
			},
		},
		paths: {
			"/check": {
				post: {
					summary: "Check Entitlement",
					description:
						"Check if a customer has access to a feature or product. This is the core entitlement check that validates whether a customer can access a specific feature based on their active subscriptions and feature balances. Returns allowed status, remaining balance, and optionally a preview of what would happen.",
					tags: ["Core"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The unique identifier of the customer to check entitlements for",
										},
										feature_id: {
											type: "string",
											description:
												"The feature ID to check access for. Required if not checking by product_id",
										},
										product_id: {
											type: "string",
											description:
												"The product ID to check. Use this for legacy product-based checks",
										},
										entity_id: {
											type: "string",
											description:
												"Optional entity (seat/workspace) ID for entity-level entitlement checks",
										},
										required_balance: {
											type: "number",
											description:
												"The amount of balance required for this check (default: 1). For metered features, this is the quantity needed",
										},
										send_event: {
											type: "boolean",
											description:
												"If true, automatically track usage when check passes (for single_use and continuous_use features)",
										},
										with_preview: {
											type: "boolean",
											description:
												"If true, include a preview showing which products/features granted access",
										},
									},
									required: ["customer_id"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Entitlement check result",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											allowed: { type: "boolean" },
											balance: { type: "number" },
											message: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/entitled": {
				post: {
					summary: "Check if Entitled",
					description: "Alias for /check endpoint",
					tags: ["Core"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: { type: "string" },
										feature_id: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Entitlement check result",
						},
					},
				},
			},
			"/events": {
				post: {
					summary: "Track Event",
					description:
						"Track metered usage events. This increments usage counters for metered features (continuous_use, single_use, credit_system). Use this to record when a customer uses a feature. The quantity is added to the customer's current usage.",
					tags: ["Usage & Events"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The customer ID tracking usage for this event",
										},
										feature_id: {
											type: "string",
											description:
												"The feature ID being used. Must be a metered feature type",
										},
										quantity: {
											type: "number",
											description:
												"The quantity to increment usage by (default: 1). For credit systems, this decrements the balance",
										},
										entity_id: {
											type: "string",
											description:
												"Optional entity ID for tracking entity-level usage (seats/workspaces)",
										},
									},
									required: ["customer_id", "feature_id"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Event tracked successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean" },
											message: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/track": {
				post: {
					summary: "Track Event (Alias)",
					description: "Alias for /events endpoint",
					tags: ["Usage & Events"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: { type: "string" },
										feature_id: { type: "string" },
										quantity: { type: "number" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Event tracked successfully",
						},
					},
				},
			},
			"/usage": {
				post: {
					summary: "Set Usage",
					description:
						"Set the absolute usage value for a customer's feature (not incremental). Unlike /events which increments usage, this sets the total usage to an exact value. Useful for syncing usage from external systems or resetting counters. For credit systems, this sets the remaining balance.",
					tags: ["Usage & Events"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description: "The customer ID to set usage for",
										},
										feature_id: {
											type: "string",
											description:
												"The feature ID to set usage for. Must be a metered feature",
										},
										usage: {
											type: "number",
											description:
												"The absolute usage value to set. For credit systems, this is the remaining balance to set",
										},
										entity_id: {
											type: "string",
											description:
												"Optional entity ID for setting entity-level usage",
										},
									},
									required: ["customer_id", "feature_id", "usage"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Usage set successfully",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean" },
											message: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/attach": {
				post: {
					summary: "Attach Product",
					description:
						"Attach a product to a customer, creating a subscription. This grants the customer access to all features included in the product. Can optionally include payment method for paid products and trial period. For free products, no payment method is required.",
					tags: ["Transactions"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The customer ID to attach the product to. If customer doesn't exist, one will be created",
										},
										product_id: {
											type: "string",
											description:
												"The product ID to attach. Must be an active product in your catalog",
										},
										payment_method_id: {
											type: "string",
											description:
												"Stripe payment method ID. Required for paid products unless starting with a trial",
										},
										trial_days: {
											type: "number",
											description:
												"Number of days for trial period. Customer gets full access without payment during trial",
										},
									},
									required: ["customer_id", "product_id"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Product attached successfully",
						},
					},
				},
			},
			"/attach/preview": {
				post: {
					summary: "Preview Attach",
					description: "Preview attaching a product without creating subscription",
					tags: ["Transactions"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: { type: "string" },
										product_id: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Attach preview",
						},
					},
				},
			},
			"/checkout": {
				post: {
					summary: "Create Checkout Session",
					description:
						"Create a Stripe Checkout session for a customer to subscribe to a product. Returns a URL to redirect the customer to Stripe's hosted checkout page. After successful payment, Stripe will redirect to your success_url and automatically create the subscription.",
					tags: ["Transactions"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The customer ID for the checkout. If customer doesn't exist, one will be created",
										},
										product_id: {
											type: "string",
											description:
												"The product ID the customer is checking out for",
										},
										success_url: {
											type: "string",
											description:
												"URL to redirect to after successful payment. Stripe will append ?session_id={CHECKOUT_SESSION_ID}",
										},
										cancel_url: {
											type: "string",
											description:
												"URL to redirect to if customer cancels the checkout",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Checkout session created",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											url: { type: "string" },
											session_id: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/cancel": {
				post: {
					summary: "Cancel Subscription",
					description:
						"Cancel a customer's subscription to a product. Can cancel immediately or at the end of the current billing period. When cancelled, the customer loses access to all features included in that product (unless they have the feature from another active product).",
					tags: ["Transactions"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The customer ID whose subscription to cancel",
										},
										product_id: {
											type: "string",
											description:
												"The product ID to cancel the subscription for",
										},
										cancel_at_period_end: {
											type: "boolean",
											description:
												"If true, subscription stays active until end of billing period. If false, cancels immediately",
										},
									},
									required: ["customer_id", "product_id"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Subscription cancelled",
						},
					},
				},
			},
			"/setup_payment": {
				post: {
					summary: "Setup Payment Method",
					description: "Setup a payment method for a customer",
					tags: ["Transactions"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: { type: "string" },
										return_url: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Payment setup session created",
						},
					},
				},
			},
			"/customers": {
				get: {
					summary: "List Customers",
					description:
						"Retrieve a paginated list of all customers in your organization. Returns basic customer information including ID, name, email, and creation date. Use the expand parameter to include additional data like products and features.",
					tags: ["Customers"],
					parameters: [
						{
							name: "limit",
							in: "query",
							schema: { type: "integer", minimum: 10, maximum: 100 },
							description:
								"Number of customers to return per page (min: 10, max: 100, default: 20)",
						},
						{
							name: "offset",
							in: "query",
							schema: { type: "integer", minimum: 0 },
							description:
								"Number of customers to skip for pagination (default: 0)",
						},
					],
					responses: {
						"200": {
							description: "List of customers",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											list: {
												type: "array",
												items: { $ref: "#/components/schemas/Customer" },
											},
											count: { type: "integer" },
										},
									},
								},
							},
						},
					},
				},
				post: {
					summary: "Create Customer",
					description:
						"Create a new customer in your system. You can provide your own customer ID or let Autumn generate one. Email is recommended for Stripe integration. Once created, you can attach products to grant access to features.",
					tags: ["Customers"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										id: {
											type: "string",
											description:
												"Optional custom ID for the customer. If not provided, Autumn will generate one. Must be unique",
										},
										email: {
											type: "string",
											description:
												"Customer's email address. Required for Stripe billing integration",
										},
										name: {
											type: "string",
											description:
												"Customer's display name (e.g., full name or company name)",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Customer created",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Customer" },
								},
							},
						},
					},
				},
			},
			"/customers/{customer_id}": {
				get: {
					summary: "Get Customer",
					description:
						"Retrieve detailed information about a specific customer including their subscriptions, feature access, and usage data. Use the expand parameter to include related data in a single request.",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
							description: "The unique customer ID",
						},
						{
							name: "expand",
							in: "query",
							schema: { type: "string" },
							description:
								"Comma-separated list of fields to expand. Options: 'products' (active products), 'features' (available features), 'balances' (feature usage), 'entities' (seats/workspaces)",
						},
					],
					responses: {
						"200": {
							description: "Customer details",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Customer" },
								},
							},
						},
					},
				},
				post: {
					summary: "Update Customer",
					description:
						"Update an existing customer's information including name, email, or custom metadata. Changes are synced to Stripe if the customer has a Stripe customer ID.",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
							description: "The unique customer ID to update",
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										email: {
											type: "string",
											description: "New email address for the customer",
										},
										name: {
											type: "string",
											description: "New display name for the customer",
										},
										metadata: {
											type: "object",
											description:
												"Custom key-value pairs to store with the customer. Useful for storing external IDs or custom data",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Customer updated",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Customer" },
								},
							},
						},
					},
				},
				delete: {
					summary: "Delete Customer",
					description:
						"Permanently delete a customer and all associated data including subscriptions, usage history, and feature balances. This action cannot be undone. Active Stripe subscriptions will be cancelled.",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
							description: "The unique customer ID to delete",
						},
					],
					responses: {
						"200": {
							description: "Customer deleted",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean" },
											message: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/customers/{customer_id}/balances": {
				post: {
					summary: "Set Feature Balances",
					description:
						"Manually set the balance for a specific feature for a customer. Useful for granting credits, resetting counters, or syncing from external systems. For credit_system features, this sets the remaining credits. For other metered features, this sets the current usage.",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
							description: "The customer ID to set balances for",
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										feature_id: {
											type: "string",
											description:
												"The feature ID to set the balance for. Must be a metered feature",
										},
										balance: {
											type: "number",
											description:
												"The balance value to set. For credit_system, this is remaining credits. For usage-based, this is current usage amount",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Balance updated",
						},
					},
				},
			},
			"/customers/{customer_id}/billing_portal": {
				get: {
					summary: "Get Billing Portal URL",
					description:
						"Generate a Stripe Customer Portal URL where customers can manage their subscription, update payment methods, view invoices, and cancel subscriptions. This provides a self-service billing experience hosted by Stripe.",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
							description:
								"The customer ID to generate billing portal for. Customer must have a Stripe customer ID",
						},
					],
					responses: {
						"200": {
							description: "Billing portal URL",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											url: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
				post: {
					summary: "Create Billing Portal Session",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										return_url: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Billing portal session created",
						},
					},
				},
			},
			"/customers/{customer_id}/coupons/{coupon_id}": {
				post: {
					summary: "Add Coupon to Customer",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "coupon_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Coupon added",
						},
					},
				},
			},
			"/customers/{customer_id}/transfer": {
				post: {
					summary: "Transfer Product",
					description: "Transfer a product from one customer to another",
					tags: ["Customers"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										to_customer_id: { type: "string" },
										product_id: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Product transferred",
						},
					},
				},
			},
			"/customers/{customer_id}/entities": {
				get: {
					summary: "List Entities",
					description: "List all entities (seats/workspaces) for a customer",
					tags: ["Entities"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "List of entities",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											list: { type: "array", items: { type: "object" } },
										},
									},
								},
							},
						},
					},
				},
				post: {
					summary: "Create Entity",
					tags: ["Entities"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										entity_id: { type: "string" },
										metadata: { type: "object" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Entity created",
						},
					},
				},
			},
			"/customers/{customer_id}/entities/{entity_id}": {
				get: {
					summary: "Get Entity",
					tags: ["Entities"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "entity_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Entity details",
						},
					},
				},
				delete: {
					summary: "Delete Entity",
					tags: ["Entities"],
					parameters: [
						{
							name: "customer_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "entity_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Entity deleted",
						},
					},
				},
			},
			"/products": {
				get: {
					summary: "List Products",
					description:
						"Retrieve all products in your catalog. Products are pricing tiers that bundle features together. Each product can have different pricing, billing intervals, and feature access levels.",
					tags: ["Products"],
					responses: {
						"200": {
							description: "List of products",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											list: {
												type: "array",
												items: { $ref: "#/components/schemas/Product" },
											},
										},
									},
								},
							},
						},
					},
				},
				post: {
					summary: "Create Product",
					description:
						"Create a new product (pricing tier) in your catalog. Products define pricing, billing intervals, and which features are included. After creation, you can attach features and set up Stripe pricing.",
					tags: ["Products"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description:
												"Product name (e.g., 'Pro Plan', 'Enterprise')",
										},
										description: {
											type: "string",
											description:
												"Product description shown to customers",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Product created",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Product" },
								},
							},
						},
					},
				},
			},
			"/products/{product_id}": {
				get: {
					summary: "Get Product",
					tags: ["Products"],
					parameters: [
						{
							name: "product_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Product details",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Product" },
								},
							},
						},
					},
				},
				post: {
					summary: "Update Product",
					tags: ["Products"],
					parameters: [
						{
							name: "product_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: { type: "string" },
										description: { type: "string" },
										pricing: { type: "object" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Product updated",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Product" },
								},
							},
						},
					},
				},
				delete: {
					summary: "Delete Product",
					tags: ["Products"],
					parameters: [
						{
							name: "product_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
						{
							name: "all_versions",
							in: "query",
							schema: { type: "boolean" },
							description: "Delete all versions of the product",
						},
					],
					responses: {
						"200": {
							description: "Product deleted",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											success: { type: "boolean" },
											message: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/products/{product_id}/copy": {
				post: {
					summary: "Copy Product",
					description: "Create a duplicate of an existing product",
					tags: ["Products"],
					parameters: [
						{
							name: "product_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										new_name: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Product copied",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Product" },
								},
							},
						},
					},
				},
			},
			"/products/all/init_stripe": {
				post: {
					summary: "Initialize Stripe Products",
					description: "Initialize all products in Stripe",
					tags: ["Products"],
					responses: {
						"200": {
							description: "Products initialized in Stripe",
						},
					},
				},
			},
			"/features": {
				get: {
					summary: "List Features",
					description:
						"Retrieve all features in your system. Features are the individual capabilities that can be included in products and have their usage tracked. Each feature has a type that determines how usage is tracked.",
					tags: ["Features"],
					responses: {
						"200": {
							description: "List of features",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											list: {
												type: "array",
												items: { $ref: "#/components/schemas/Feature" },
											},
										},
									},
								},
							},
						},
					},
				},
				post: {
					summary: "Create Feature",
					description:
						"Create a new feature that can be included in products. Feature types: 'boolean' (on/off), 'single_use' (consumed on use), 'continuous_use' (incremental usage tracking), 'credit_system' (prepaid credits that decrement).",
					tags: ["Features"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description:
												"Feature name (e.g., 'API Calls', 'Storage')",
										},
										type: {
											type: "string",
											enum: [
												"boolean",
												"single_use",
												"continuous_use",
												"credit_system",
											],
											description:
												"Feature type: boolean (simple on/off), single_use (consumed once), continuous_use (cumulative usage), credit_system (prepaid credits)",
										},
										description: {
											type: "string",
											description: "Feature description for documentation",
										},
									},
									required: ["name", "type"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Feature created",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Feature" },
								},
							},
						},
					},
				},
			},
			"/features/{feature_id}": {
				get: {
					summary: "Get Feature",
					tags: ["Features"],
					parameters: [
						{
							name: "feature_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Feature details",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Feature" },
								},
							},
						},
					},
				},
				post: {
					summary: "Update Feature",
					tags: ["Features"],
					parameters: [
						{
							name: "feature_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: { type: "string" },
										description: { type: "string" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Feature updated",
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/Feature" },
								},
							},
						},
					},
				},
				delete: {
					summary: "Delete Feature",
					tags: ["Features"],
					parameters: [
						{
							name: "feature_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Feature deleted",
						},
					},
				},
			},
			"/rewards": {
				get: {
					summary: "List Rewards",
					description:
						"Retrieve all rewards/coupons in your system. Rewards can be applied to customers to give discounts, credits, or special access.",
					tags: ["Rewards & Referrals"],
					responses: {
						"200": {
							description: "List of rewards",
						},
					},
				},
				post: {
					summary: "Create Reward",
					description:
						"Create a new reward or coupon that can be applied to customers. Rewards can provide percentage discounts, fixed amount discounts, or grant feature credits.",
					tags: ["Rewards & Referrals"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description: "Reward name (e.g., 'Welcome Bonus')",
										},
										type: {
											type: "string",
											description:
												"Reward type: 'percentage', 'fixed_amount', or 'credits'",
										},
										value: {
											type: "number",
											description:
												"Reward value (percentage, dollar amount, or number of credits)",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Reward created",
						},
					},
				},
			},
			"/rewards/{id}": {
				get: {
					summary: "Get Reward",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Reward details",
						},
					},
				},
				post: {
					summary: "Update Reward",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: { type: "string" },
										value: { type: "number" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Reward updated",
						},
					},
				},
				delete: {
					summary: "Delete Reward",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Reward deleted",
						},
					},
				},
			},
			"/reward_programs": {
				post: {
					summary: "Create Reward Program",
					tags: ["Rewards & Referrals"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: { type: "string" },
										rules: { type: "object" },
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Reward program created",
						},
					},
				},
			},
			"/reward_programs/{id}": {
				put: {
					summary: "Update Reward Program",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Reward program updated",
						},
					},
				},
				delete: {
					summary: "Delete Reward Program",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Reward program deleted",
						},
					},
				},
			},
			"/referrals/code": {
				post: {
					summary: "Get Referral Code",
					description:
						"Get or create a unique referral code for a customer. Customers can share this code with others. When someone redeems it, both the referrer and referee can receive rewards based on your reward program configuration.",
					tags: ["Rewards & Referrals"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										customer_id: {
											type: "string",
											description:
												"The customer ID to generate or retrieve a referral code for",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Referral code",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											code: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/referrals/redeem": {
				post: {
					summary: "Redeem Referral",
					description:
						"Redeem a referral code for a customer. Applies rewards to both the referrer (who shared the code) and the referee (who is redeeming it) according to your reward program rules. Can only redeem once per customer.",
					tags: ["Rewards & Referrals"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										code: {
											type: "string",
											description: "The referral code to redeem",
										},
										customer_id: {
											type: "string",
											description:
												"The customer ID redeeming the code (the referee)",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Referral redeemed",
						},
					},
				},
			},
			"/redemptions/{redemption_id}": {
				get: {
					summary: "Get Redemption",
					tags: ["Rewards & Referrals"],
					parameters: [
						{
							name: "redemption_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Redemption details",
						},
					},
				},
			},
			"/migrations": {
				post: {
					summary: "Migrate Customers",
					description:
						"Migrate customers from one product to another (e.g., upgrading all 'Basic' customers to 'Pro'). Handles subscription updates in Stripe and preserves feature access during transition. Useful for bulk plan changes or product version upgrades.",
					tags: ["Advanced"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										from_product_id: {
											type: "string",
											description:
												"The product ID customers are currently on",
										},
										to_product_id: {
											type: "string",
											description: "The product ID to migrate customers to",
										},
										customer_ids: {
											type: "array",
											items: { type: "string" },
											description:
												"Array of customer IDs to migrate. If empty, migrates all customers on the from_product",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Migration completed",
						},
					},
				},
			},
			"/query": {
				post: {
					summary: "Query Analytics",
					description:
						"Query usage and analytics data from ClickHouse. Retrieve aggregated metrics about customer usage, feature adoption, revenue, and more. Supports flexible time ranges and custom queries for building dashboards and reports.",
					tags: ["Advanced"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										query: {
											type: "string",
											description:
												"The analytics query to execute (e.g., 'revenue_by_product', 'feature_usage')",
										},
										start_date: {
											type: "string",
											format: "date-time",
											description: "Start date for the analytics time range",
										},
										end_date: {
											type: "string",
											format: "date-time",
											description: "End date for the analytics time range",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Query results",
						},
					},
				},
			},
			"/components/pricing_table": {
				get: {
					summary: "Get Pricing Table Data",
					description:
						"Get structured data for rendering a pricing table UI component. Returns all products with their features, pricing, and display information optimized for pricing page rendering.",
					tags: ["Advanced"],
					responses: {
						"200": {
							description: "Pricing table data",
						},
					},
				},
			},
			"/batch/customers": {
				post: {
					summary: "Batch Customer Operations",
					description:
						"Perform operations on multiple customers at once. Supports bulk updates, deletions, balance adjustments, and more. Operations are processed asynchronously for large batches.",
					tags: ["Advanced"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										operation: {
											type: "string",
											description:
												"Operation type: 'update', 'delete', 'set_balance', 'attach_product', etc.",
										},
										customer_ids: {
											type: "array",
											items: { type: "string" },
											description:
												"Array of customer IDs to perform the operation on",
										},
										data: {
											type: "object",
											description:
												"Operation-specific data (e.g., fields to update, balance values)",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Batch operation completed",
						},
					},
				},
			},
			"/invoices/{stripe_invoice_id}/stripe": {
				get: {
					summary: "Get Stripe Invoice",
					description: "Get Stripe invoice details",
					tags: ["Advanced"],
					parameters: [
						{
							name: "stripe_invoice_id",
							in: "path",
							required: true,
							schema: { type: "string" },
						},
					],
					responses: {
						"200": {
							description: "Stripe invoice details",
						},
					},
				},
			},
			"/platform/organizations": {
				get: {
					summary: "List Platform Organizations",
					description:
						"List all organizations on your platform (multi-tenant mode). Each organization has its own isolated set of customers, products, and features. Useful for B2B SaaS platforms managing multiple client companies.",
					tags: ["Platform & Multi-tenant"],
					responses: {
						"200": {
							description: "List of organizations",
						},
					},
				},
				post: {
					summary: "Create Platform Organization",
					description:
						"Create a new organization on your platform. Each organization is a separate tenant with its own Stripe account, products, and customers. Use this for B2B SaaS where you manage billing for multiple companies.",
					tags: ["Platform & Multi-tenant"],
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description:
												"Organization name (e.g., 'Acme Corp', 'TechStart Inc')",
										},
										email: {
											type: "string",
											description:
												"Primary contact email for the organization",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Organization created",
						},
					},
				},
			},
			"/platform/oauth_url": {
				post: {
					summary: "Get Stripe OAuth URL",
					description: "Get Stripe Connect OAuth URL for platform",
					tags: ["Platform & Multi-tenant"],
					responses: {
						"200": {
							description: "OAuth URL",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											url: { type: "string" },
										},
									},
								},
							},
						},
					},
				},
			},
			"/organization": {
				get: {
					summary: "Get Organization",
					description:
						"Get details about your current organization including name, Stripe connection status, settings, and configuration. This returns information about the authenticated organization.",
					tags: ["Organization"],
					responses: {
						"200": {
							description: "Organization details",
						},
					},
				},
				patch: {
					summary: "Update Organization",
					description:
						"Update your organization settings including name, branding, billing configuration, and feature flags. Changes apply to your entire organization.",
					tags: ["Organization"],
					requestBody: {
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
											description: "Organization name",
										},
										settings: {
											type: "object",
											description:
												"Organization settings (branding, features, billing configuration)",
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Organization updated",
						},
					},
				},
			},
			"/organization/stripe": {
				get: {
					summary: "Get Stripe Account",
					description:
						"Get information about your connected Stripe account including account ID, status, and capabilities. Returns null if no Stripe account is connected.",
					tags: ["Organization"],
					responses: {
						"200": {
							description: "Stripe account details",
						},
					},
				},
				post: {
					summary: "Connect Stripe",
					description:
						"Connect a Stripe account to enable payment processing. Required for charging customers and managing subscriptions. Use the OAuth flow (/organization/stripe/oauth_url) for production or provide test credentials for development.",
					tags: ["Organization"],
					responses: {
						"200": {
							description: "Stripe connected",
						},
					},
				},
				delete: {
					summary: "Disconnect Stripe",
					description:
						"Disconnect your Stripe account. This will prevent new charges but existing subscriptions will remain active. Customers won't be able to make new purchases until you reconnect Stripe.",
					tags: ["Organization"],
					responses: {
						"200": {
							description: "Stripe disconnected",
						},
					},
				},
			},
			"/organization/stripe/oauth_url": {
				get: {
					summary: "Get Stripe OAuth URL",
					description:
						"Get a Stripe Connect OAuth URL to connect your Stripe account. Redirect users to this URL to complete the Stripe Connect flow. After authorization, Stripe redirects back to your specified return URL.",
					tags: ["Organization"],
					responses: {
						"200": {
							description: "OAuth URL",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											url: {
												type: "string",
												description: "Stripe Connect OAuth authorization URL",
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};
};

