import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CustomerDTO } from "@medusajs/framework/types";
import {
  IKlaviyoService,
  KLAVIYO_MODULE,
  KlaviyoConsent,
} from "../../types/klaviyo";
import {
  SubscriptionChannels,
  SubscriptionParameters,
  ProfileResponseObjectResource,
} from "klaviyo-api";

type HandleCustomerConsentInput = {
  profileId: string;
  customer: CustomerDTO;
};

const handleCustomerConsentStep = createStep(
  "handle-customer-consent",
  async ({ profileId, customer }: HandleCustomerConsentInput, context) => {
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    // Default to no consent if metadata is missing
    if (!customer.metadata || !customer.metadata.klaviyo) {
      return new StepResponse(
        "No Klaviyo consent metadata found for customer",
        null
      );
    }

    // Try to parse the klaviyo consent object from metadata
    let consentData: KlaviyoConsent;
    try {
      consentData =
        typeof customer.metadata.klaviyo === "string"
          ? JSON.parse(customer.metadata.klaviyo)
          : customer.metadata.klaviyo;
    } catch (error) {
      console.error(
        `Error parsing klaviyo consent data for customer ${customer.id}:`,
        error
      );
      return new StepResponse("Invalid Klaviyo consent data format", null);
    }

    // Check if there's any consent set
    const hasEmailConsent = Boolean(consentData.email);
    const hasSmsConsent = Boolean(consentData.sms);
    const hasTransactionalSmsConsent = Boolean(consentData.transactional_sms);

    if (!hasEmailConsent && !hasSmsConsent) {
      return new StepResponse(
        "Customer has not provided consent for any channel",
        null
      );
    }

    // Prepare the profile data with optional typing to handle nulls
    const attributes: {
      email?: string;
      phone_number?: string;
      subscriptions: SubscriptionChannels;
      external_id?: string;
    } = {
      external_id: profileId,
      subscriptions: {} as SubscriptionChannels,
    };

    // Only add defined values
    if (customer.email && hasEmailConsent) {
      attributes.email = customer.email;
      attributes.subscriptions.email = {
        marketing: {
          consent: SubscriptionParameters.ConsentEnum.Subscribed,
        },
      };
    }

    if (customer.phone) {
      attributes.phone_number = customer.phone;
      if (hasTransactionalSmsConsent) {
        attributes.subscriptions.sms = {
          ...attributes.subscriptions.sms,
          transactional: {
            consent: SubscriptionParameters.ConsentEnum.Subscribed,
          },
        };
      }
      if (hasSmsConsent) {
        attributes.subscriptions.sms = {
          ...attributes.subscriptions.sms,
          marketing: {
            consent: SubscriptionParameters.ConsentEnum.Subscribed,
          },
        };
      }
    }

    if (!attributes.subscriptions.email && !attributes.subscriptions.sms) {
      return new StepResponse(
        "Customer has not provided consent for any channel",
        null
      );
    }

    // Build the payload for bulk subscribe
    const payload = [
      {
        type: "profile" as const,
        id: profileId,
        attributes: attributes as any,
      },
    ];

    console.log("attributes from handle-customer-consent step", attributes);

    try {
      const result = await klaviyoService.bulkSubscribeProfiles(payload);
      return new StepResponse(
        `Customer ${customer.id} subscribed to Klaviyo channels: ${
          hasEmailConsent ? "email " : ""
        }${hasSmsConsent ? "sms" : ""}`,
        result
      );
    } catch (error) {
      console.error(
        `Error subscribing customer ${customer.id} to Klaviyo:`,
        error
      );
      return new StepResponse("Failed to subscribe customer to Klaviyo", null);
    }
  }
);

export default handleCustomerConsentStep;
