import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      route,
      package: packageName,
      term,
      billingMode,
      selectedAmount,
      depositAmount
    } = req.body || {};

    if (!name) return res.status(400).json({ error: "Missing name" });
    if (!email) return res.status(400).json({ error: "Missing email" });
    if (!route) return res.status(400).json({ error: "Missing route" });
    if (!packageName) return res.status(400).json({ error: "Missing package" });
    if (!term) return res.status(400).json({ error: "Missing term" });
    if (!billingMode) return res.status(400).json({ error: "Missing billingMode" });
    if (typeof depositAmount !== "number" || depositAmount <= 0) {
      return res.status(400).json({ error: "Invalid depositAmount" });
    }

    const origin =
      req.headers.origin ||
      process.env.PUBLIC_SITE_URL ||
      "https://eyelevelmobile.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      success_url: `${origin}/mobile-shared-access-agreement?payment=success`,
      cancel_url: `${origin}/mobile-shared-access-agreement?payment=cancel`,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Eye Level Mobile Deposit - ${packageName}`,
              description: `${billingMode} deposit for ${route}`
            },
            unit_amount: Math.round(depositAmount * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        name: String(name || ""),
        email: String(email || ""),
        route: String(route || ""),
        package: String(packageName || ""),
        term: String(term || ""),
        billingMode: String(billingMode || ""),
        selectedAmount: String(selectedAmount || ""),
        depositAmount: String(depositAmount || "")
      }
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error("Stripe error:", error);
    return res.status(500).json({
      error: error.message || "Unable to create checkout session"
    });
  }
}
