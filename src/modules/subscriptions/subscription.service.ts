import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma";

let stripeClient: Stripe | null = null;

const getStripeClient = () => {
  if (stripeClient) return stripeClient;

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in environment variables.");
  }

  stripeClient = new Stripe(secret);
  return stripeClient;
};

const calculateEndDate = (
  interval: "DAILY" | "MONTHLY" | "YEARLY" | "LIFETIME"
) => {
  const now = new Date();

  if (interval === "LIFETIME") {
    const lifetimeDate = new Date(now);
    lifetimeDate.setFullYear(lifetimeDate.getFullYear() + 100);
    return lifetimeDate;
  }

  const endDate = new Date(now);

  if (interval === "DAILY") {
    endDate.setDate(endDate.getDate() + 1);
  } else if (interval === "MONTHLY") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (interval === "YEARLY") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  return endDate;
};

export const SubscriptionService = {
  create: async (studentId: string, planId: string) => {
    if (!planId) throw new Error("planId is required");

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        interval: true,
        isActive: true,
      },
    });

    if (!plan) throw new Error("Plan not found");
    if (!plan.isActive) throw new Error("Plan is not active");

    const existingActive = await prisma.subscription.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
    });

    if (existingActive) {
      throw new Error("Student already has an active subscription");
    }

    const existingPending = await prisma.subscription.findFirst({
      where: {
        studentId,
        planId,
        status: "PENDING",
      },
      select: {
        id: true,
        studentId: true,
        planId: true,
        status: true,
        paymentStatus: true,
        startDate: true,
        endDate: true,
        paymentProvider: true,
        externalRef: true,
        createdAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            currency: true,
            interval: true,
            isActive: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            transactionId: true,
            status: true,
            invoiceUrl: true,
            paymentGatewayData: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingPending) {
      return existingPending;
    }

    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          studentId,
          planId,
          status: "PENDING",
          paymentStatus: "UNPAID",
          startDate: null,
          endDate: null,
        },
        select: {
          id: true,
          studentId: true,
          planId: true,
          status: true,
          paymentStatus: true,
          startDate: true,
          endDate: true,
          paymentProvider: true,
          externalRef: true,
          createdAt: true,
        },
      });

      const payment = await tx.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: plan.price,
          transactionId: randomUUID(),
          status: "UNPAID",
        },
        select: {
          id: true,
          amount: true,
          transactionId: true,
          status: true,
          invoiceUrl: true,
          createdAt: true,
        },
      });

      return {
        ...subscription,
        payment,
      };
    });
  },

  initiatePayment: async (studentId: string, subscriptionId: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        studentId: true,
        status: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            currency: true,
            interval: true,
            isActive: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) throw new Error("Subscription not found");
    if (subscription.studentId !== studentId) throw new Error("Forbidden");
    if (!subscription.plan) throw new Error("Plan not found");
    if (!subscription.plan.isActive) throw new Error("Plan is not active");
    if (!subscription.payment) throw new Error("Payment record not found");
    if (subscription.payment.status === "PAID") {
      throw new Error("Payment already completed for this subscription");
    }
    if (subscription.status === "CANCELLED") {
      throw new Error("Subscription is cancelled");
    }

     const stripe = getStripeClient();
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: ("BDT").toLowerCase(),
            product_data: {
              name: `Session with ${subscription.plan?.name}`,
            },
            unit_amount: subscription.plan?.price * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        subscriptionId: subscription.id,
        paymentId: subscription.payment.id,
      },
      success_url: `${frontendUrl}/dashboard/payment/payment-success?subscription_id=${subscription.id}&payment_id=${subscription.payment.id}`,
      cancel_url: `${frontendUrl}/dashboard/bookings?error=payment_cancelled`,
    });

   
    return {
      paymentUrl: session.url,
      sessionId: session.id,
    };
  },


  list: async (studentId: string, role: string) => {
    const where = role === "admin" ? {} : { studentId };

    return prisma.subscription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        startDate: true,
        endDate: true,
        paymentProvider: true,
        externalRef: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            currency: true,
            interval: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            transactionId: true,
            status: true,
            invoiceUrl: true,
            paymentGatewayData: true,
          },
        },
      },
    });
  },

  getMyActive: async (studentId: string) => {
    const subscription = await prisma.subscription.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        startDate: true,
        endDate: true,
        paymentProvider: true,
        externalRef: true,
        createdAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            currency: true,
            interval: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            transactionId: true,
            status: true,
            invoiceUrl: true,
            paymentGatewayData: true,
          },
        },
      },
    });

    if (!subscription) throw new Error("No active subscription found");

    return subscription;
  },

  cancel: async (studentId: string, subscriptionId: string) => {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        studentId: true,
        status: true,
        paymentStatus: true,
        payment: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!subscription) throw new Error("Subscription not found");
    if (subscription.studentId !== studentId) throw new Error("Forbidden");
    if (subscription.status !== "ACTIVE" && subscription.status !== "PENDING") {
      throw new Error("Only active or pending subscriptions can be cancelled");
    }

    return prisma.$transaction(async (tx) => {
      if (subscription.payment && subscription.payment.status === "UNPAID") {
        await tx.payment.update({
          where: { id: subscription.payment.id },
          data: {
            status: "UNPAID",
          },
        });
      }

      return tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELLED",
          paymentStatus:
            subscription.paymentStatus === "PAID" ? "PAID" : "UNPAID",
        },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          startDate: true,
          endDate: true,
        },
      });
    });
  },
};