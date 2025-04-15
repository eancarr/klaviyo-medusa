import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ProfileCreateQueryResourceObjectAttributes } from "klaviyo-api";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";

const syncCustomerProfileStep = createStep(
  "sync-customer-profile",
  async (attributes: ProfileCreateQueryResourceObjectAttributes, context) => {
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    const profile = await klaviyoService.upsertProfile(attributes);

    return new StepResponse(profile, profile.data.id);
  }
);

export default syncCustomerProfileStep;
