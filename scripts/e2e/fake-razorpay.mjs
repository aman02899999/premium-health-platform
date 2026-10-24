// A local stand-in for the two Razorpay API calls the site makes: create an order and list an
// order's payments. Start the site with RAZORPAY_API_URL pointing here (see payments.mjs).
// Nothing in this file talks to the real Razorpay.
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

const id = (prefix) => `${prefix}_${randomBytes(7).toString("hex").slice(0, 14)}`;

/** Orders created through the stand-in, and the payments a test has marked as captured. */
export function startFakeRazorpay(port = 4010) {
  const orders = new Map();
  const payments = new Map(); // order id -> payment[]
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const send = (status, json) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(json));
      };
      if (!String(req.headers.authorization ?? "").startsWith("Basic ")) return send(401, { error: { description: "Authentication failed" } });
      if (req.method === "POST" && req.url === "/v1/orders") {
        const input = JSON.parse(body || "{}");
        const order = { id: id("order"), amount: input.amount, currency: input.currency, receipt: input.receipt, status: "created", notes: input.notes };
        orders.set(order.id, order);
        return send(200, order);
      }
      const m = req.url?.match(/^\/v1\/orders\/(order_[A-Za-z0-9]+)\/payments$/);
      if (req.method === "GET" && m) return send(200, { items: payments.get(m[1]) ?? [] });
      send(404, { error: { description: `fake razorpay: no route ${req.method} ${req.url}` } });
    });
  });
  return new Promise((resolve) =>
    server.listen(port, "127.0.0.1", () =>
      resolve({
        orders,
        /** Makes Razorpay "hold" a captured payment for an order, for reconciliation to find. */
        capture(orderId, amount, paymentId = id("pay")) {
          payments.set(orderId, [{ id: paymentId, order_id: orderId, amount, currency: "INR", status: "captured" }]);
          return paymentId;
        },
        newPaymentId: () => id("pay"),
        close: () => new Promise((r) => server.close(r)),
      }),
    ),
  );
}
