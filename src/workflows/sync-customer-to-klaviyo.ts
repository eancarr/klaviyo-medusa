import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CustomerDTO } from "@medusajs/framework/types";
import {
  ProfileCreateQueryResourceObjectAttributes,
  ProfileResponseObjectResource,
} from "klaviyo-api";
import syncCustomerProfileStep from "./steps/sync-customer-profile";
import handleCustomerConsentStep from "./steps/handle-customer-consent";

type WorkflowInput = {
  customer: CustomerDTO;
};

type WorkflowOutput = {
  profile: ProfileResponseObjectResource;
  subscriptionResult?: any;
};

export const syncCustomerToKlaviyoWorkflow = createWorkflow(
  "sync-customer-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { customer } = input;

    // Construct attributes for Klaviyo profile
    const attributes: ProfileCreateQueryResourceObjectAttributes = transform(
      customer,
      (customer) => ({
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phoneNumber: customer.phone,
        externalId: customer.id,
        properties: {
          medusa_customer_id: customer.id,
          created_at: customer.created_at,
        },
      })
    );

    // Create or update profile in Klaviyo
    const profile = syncCustomerProfileStep(attributes);

    // Process consent data if available and subscribe the customer
    const subscriptionResult = handleCustomerConsentStep({
      profileId: profile.data.id,
      customer,
    });

    return new WorkflowResponse({
      profile,
      subscriptionResult,
    });
  }
);

export default syncCustomerToKlaviyoWorkflow;
