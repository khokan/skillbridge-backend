import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            const subscriptionId = session.metadata?.subscriptionId;
            const paymentId = session.metadata?.paymentId;

            if (!subscriptionId || !paymentId) {
                console.error("Missing bookingId/paymentId metadata in checkout.session.completed");
                return { message: "Missing bookingId/paymentId metadata" };
            }

            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                select: {
                    id: true,
                    subscriptionId: true,
                    status: true,
                },
            });

            if (!payment) {
                console.error(`Payment ${paymentId} not found`);
                return { message: "Payment not found" };
            }

            if (payment.subscriptionId !== subscriptionId) {
                console.error(`Payment ${paymentId} is not linked to booking ${subscriptionId}`);
                return { message: "Payment/booking mismatch" };
            }

            const isPaid = session.payment_status === "paid";

            if (payment.status === "PAID") {
                console.log(`Payment ${paymentId} already marked as PAID. Skipping duplicate webhook processing.`);
                return { message: `Payment ${paymentId} already processed` };
            }
            

            await prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: isPaid ? "PAID" : "UNPAID",
                        paymentGatewayData: session,
                    },
                });

                await tx.subscription.update({
                    where: { id: subscriptionId },
                    data: {
                        paymentStatus: isPaid ? "PAID" : "UNPAID",
                        status: isPaid ? "ACTIVE" : "PAST_DUE",
                    },
                });
            });

            console.log(`Payment ${session.payment_status} for booking ${subscriptionId}`);
            break;
        }

        case "checkout.session.expired": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`Checkout session ${session.id} expired.`);
            break;
        }

        case "payment_intent.succeeded": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`Payment intent ${paymentIntent.id} succeeded.`);
            break;
        }

        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.log(`Payment intent ${paymentIntent.id} failed.`);
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` };
};

export const PaymentService = {
    handlerStripeWebhookEvent,
};