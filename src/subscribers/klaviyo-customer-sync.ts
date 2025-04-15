import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { syncCustomerToKlaviyoWorkflow } from "../workflows";

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerId = data.id;

  try {
    const query = container.resolve("query");
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["*"],
      filters: {
        id: customerId,
      },
      pagination: {
        take: 1,
        skip: 0,
      },
    });

    if (!customer) {
      console.error(`Customer ${customerId} not found`);
      return;
    }

    await syncCustomerToKlaviyoWorkflow(container).run({
      input: {
        customer,
      },
    });
  } catch (error) {
    console.error(`Failed to sync customer ${customerId} to Klaviyo:`, error);
  }
}

export const config: SubscriberConfig = {
  event: ["customer.created", "customer.updated"],
};
