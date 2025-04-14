import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import syncCustomerToKlaviyoWorkflow from "../workflows/sync-customer-to-klaviyo";

export default async function customerUpdatedHandler({
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
    console.error(
      `Failed to sync updated customer ${customerId} to Klaviyo:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "customer.updated",
};
