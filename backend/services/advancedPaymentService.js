const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AdvancedPaymentService {
  /**
   * Create subscription with advanced features
   */
  async createAdvancedSubscription(userId, planId, paymentMethodId, options = {}) {
    try {
      // Get user and plan details
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      // Create or retrieve Stripe customer
      let stripeCustomer = await this.getOrCreateStripeCustomer(user);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription with advanced features
      const subscriptionData = {
        customer: stripeCustomer.id,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId,
          planId: planId,
          features: JSON.stringify(options.features || [])
        }
      };

      // Add trial period if specified
      if (options.trialDays) {
        subscriptionData.trial_period_days = options.trialDays;
      }

      // Add discount if applicable
      if (options.couponId) {
        subscriptionData.coupon = options.couponId;
      }

      const stripeSubscription = await stripe.subscriptions.create(subscriptionData);

      // Store subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: stripeCustomer.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          amount: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          features: JSON.stringify(options.features || []),
          metadata: JSON.stringify(options.metadata || {})
        }
      });

      return {
        success: true,
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: stripeSubscription.id
      };
    } catch (error) {
      console.error('Error creating advanced subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process one-time payment with advanced features
   */
  async processAdvancedPayment(userId, amount, currency, paymentMethodId, options = {}) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create or retrieve Stripe customer
      let stripeCustomer = await this.getOrCreateStripeCustomer(user);

      // Create payment intent with advanced features
      const paymentIntentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customer: stripeCustomer.id,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        return_url: options.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        metadata: {
          userId: userId,
          type: options.type || 'one_time',
          description: options.description || 'Payment'
        }
      };

      // Add automatic payment methods if enabled
      if (options.automaticPaymentMethods) {
        paymentIntentData.automatic_payment_methods = { enabled: true };
      }

      // Add application fee if this is a marketplace transaction
      if (options.applicationFeeAmount) {
        paymentIntentData.application_fee_amount = Math.round(options.applicationFeeAmount * 100);
      }

      // Add connected account if processing for a connected account
      if (options.stripeAccountId) {
        paymentIntentData.transfer_data = {
          destination: options.stripeAccountId,
        };
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      // Store payment record
      const payment = await prisma.payment.create({
        data: {
          userId,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          currency,
          status: paymentIntent.status,
          paymentMethod: 'stripe',
          type: options.type || 'one_time',
          description: options.description || 'Payment',
          metadata: JSON.stringify(options.metadata || {})
        }
      });

      return {
        success: true,
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        requiresAction: paymentIntent.status === 'requires_action'
      };
    } catch (error) {
      console.error('Error processing advanced payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle marketplace payments with split transactions
   */
  async processMarketplacePayment(buyerId, sellerId, amount, currency, paymentMethodId, options = {}) {
    try {
      const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
      const seller = await prisma.user.findUnique({ where: { id: sellerId } });

      if (!buyer || !seller) {
        throw new Error('Buyer or seller not found');
      }

      // Get seller's connected account
      const sellerAccount = await prisma.stripeAccount.findUnique({
        where: { userId: sellerId }
      });

      if (!sellerAccount) {
        throw new Error('Seller does not have a connected Stripe account');
      }

      // Calculate platform fee
      const platformFeeRate = options.platformFeeRate || 0.05; // 5% default
      const platformFeeAmount = amount * platformFeeRate;
      const sellerAmount = amount - platformFeeAmount;

      // Create payment intent with transfer
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        application_fee_amount: Math.round(platformFeeAmount * 100),
        transfer_data: {
          destination: sellerAccount.stripeAccountId,
        },
        metadata: {
          buyerId,
          sellerId,
          type: 'marketplace',
          platformFee: platformFeeAmount.toString()
        }
      });

      // Store marketplace transaction
      const transaction = await prisma.marketplaceTransaction.create({
        data: {
          buyerId,
          sellerId,
          stripePaymentIntentId: paymentIntent.id,
          totalAmount: amount,
          sellerAmount,
          platformFeeAmount,
          currency,
          status: paymentIntent.status,
          metadata: JSON.stringify(options.metadata || {})
        }
      });

      return {
        success: true,
        transaction,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Error processing marketplace payment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create and manage invoices
   */
  async createAdvancedInvoice(userId, items, options = {}) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Create or retrieve Stripe customer
      let stripeCustomer = await this.getOrCreateStripeCustomer(user);

      // Create invoice items
      const invoiceItems = [];
      for (const item of items) {
        const invoiceItem = await stripe.invoiceItems.create({
          customer: stripeCustomer.id,
          amount: Math.round(item.amount * 100),
          currency: item.currency || 'usd',
          description: item.description,
          metadata: item.metadata || {}
        });
        invoiceItems.push(invoiceItem);
      }

      // Create invoice
      const invoiceData = {
        customer: stripeCustomer.id,
        auto_advance: options.autoAdvance !== false,
        collection_method: options.collectionMethod || 'charge_automatically',
        metadata: {
          userId: userId,
          type: options.type || 'standard'
        }
      };

      // Add due date if specified
      if (options.dueDate) {
        invoiceData.due_date = Math.floor(new Date(options.dueDate).getTime() / 1000);
      }

      // Add custom fields
      if (options.customFields) {
        invoiceData.custom_fields = options.customFields;
      }

      const stripeInvoice = await stripe.invoices.create(invoiceData);

      // Finalize invoice if requested
      if (options.finalize) {
        await stripe.invoices.finalizeInvoice(stripeInvoice.id);
      }

      // Send invoice if requested
      if (options.send) {
        await stripe.invoices.sendInvoice(stripeInvoice.id);
      }

      // Store invoice in database
      const invoice = await prisma.invoice.create({
        data: {
          userId,
          stripeInvoiceId: stripeInvoice.id,
          amount: stripeInvoice.amount_due / 100,
          currency: stripeInvoice.currency,
          status: stripeInvoice.status,
          dueDate: options.dueDate ? new Date(options.dueDate) : null,
          items: JSON.stringify(items),
          metadata: JSON.stringify(options.metadata || {})
        }
      });

      return {
        success: true,
        invoice,
        stripeInvoiceId: stripeInvoice.id,
        hostedInvoiceUrl: stripeInvoice.hosted_invoice_url
      };
    } catch (error) {
      console.error('Error creating advanced invoice:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle subscription lifecycle events
   */
  async handleSubscriptionWebhook(event) {
    try {
      const subscription = event.data.object;
      
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(subscription);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(subscription);
          break;
        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object);
          break;
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling subscription webhook:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate payment analytics and reports
   */
  async generatePaymentAnalytics(userId, timeframe = '30d') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }

      const analytics = {
        totalRevenue: await this.getTotalRevenue(userId, startDate, endDate),
        subscriptionRevenue: await this.getSubscriptionRevenue(userId, startDate, endDate),
        oneTimeRevenue: await this.getOneTimeRevenue(userId, startDate, endDate),
        refunds: await this.getRefunds(userId, startDate, endDate),
        churnRate: await this.calculateChurnRate(userId, startDate, endDate),
        averageOrderValue: await this.getAverageOrderValue(userId, startDate, endDate),
        paymentMethodBreakdown: await this.getPaymentMethodBreakdown(userId, startDate, endDate),
        revenueByDay: await this.getRevenueByDay(userId, startDate, endDate)
      };

      return {
        success: true,
        analytics,
        period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      };
    } catch (error) {
      console.error('Error generating payment analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  async getOrCreateStripeCustomer(user) {
    // Check if customer already exists in our database
    let customerRecord = await prisma.stripeCustomer.findUnique({
      where: { userId: user.id }
    });

    if (customerRecord) {
      return await stripe.customers.retrieve(customerRecord.stripeCustomerId);
    }

    // Create new Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id }
    });

    // Store customer record
    await prisma.stripeCustomer.create({
      data: {
        userId: user.id,
        stripeCustomerId: stripeCustomer.id
      }
    });

    return stripeCustomer;
  }

  async handleSubscriptionCreated(subscription) {
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      },
      create: {
        userId: subscription.metadata.userId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  async handleSubscriptionUpdated(subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  }

  async handleSubscriptionDeleted(subscription) {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'canceled' }
    });
  }

  async handleInvoicePaymentSucceeded(invoice) {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: 'active' }
      });
    }
  }

  async handleInvoicePaymentFailed(invoice) {
    if (invoice.subscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: invoice.subscription },
        data: { status: 'past_due' }
      });
    }
  }

  async getTotalRevenue(userId, startDate, endDate) {
    const result = await prisma.payment.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'succeeded'
      },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  async getSubscriptionRevenue(userId, startDate, endDate) {
    const result = await prisma.payment.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'succeeded',
        type: 'subscription'
      },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  async getOneTimeRevenue(userId, startDate, endDate) {
    const result = await prisma.payment.aggregate({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
        status: 'succeeded',
        type: 'one_time'
      },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  async calculateChurnRate(userId, startDate, endDate) {
    const canceledSubscriptions = await prisma.subscription.count({
      where: {
        userId,
        status: 'canceled',
        updatedAt: { gte: startDate, lte: endDate }
      }
    });

    const totalSubscriptions = await prisma.subscription.count({
      where: { userId }
    });

    return totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0;
  }
}

module.exports = new AdvancedPaymentService();
